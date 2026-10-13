// End-to-end tests for properfy.co.uk/get-started and the onboarding API.
//
//   cd onboarding-api && npm test
//
// Starts the website (static), the Worker (wrangler dev --local, with its own
// local D1 database and R2 bucket) and local stand-ins for Stripe and Resend,
// then checks the API directly and, if Playwright is available, the page in
// a real browser. Nothing is sent to Stripe or Resend.
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { startMocks, signWebhook, checkoutCompletedEvent } from './mock-services.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(HERE, '..');
const SITE_DIR = path.resolve(API_DIR, '..');
const OUT_DIR = process.env.TEST_OUT || path.join(API_DIR, '.wrangler', 'test-output');
const PORT = { site: 8765, worker: 8787, mock: 9911, draft: 8788, unset: 8789 };
const SITE = `http://127.0.0.1:${PORT.site}`;
const API = `http://127.0.0.1:${PORT.worker}`;
const MOCK = `http://127.0.0.1:${PORT.mock}`;
const SECRETS = { STRIPE_SECRET_KEY: 'sk_test_mock', STRIPE_WEBHOOK_SECRET: 'whsec_test_mock', RESEND_API_KEY: 're_test_mock', ADMIN_SECRET: 'admin_test_secret_0123456789abcdef' };
const AGREEMENT = JSON.parse(fs.readFileSync(path.join(API_DIR, 'agreement.json'), 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

let failures = 0, passes = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passes++; console.log(`  ✓ ${name}`); } else { failures++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};
const section = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A small valid PNG (a signature-like line) for API tests.
function testPng() {
  const w = 240, h = 60, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * (w * 4 + 1) + 1 + x * 4;
    if (Math.abs(y - 30 - Math.round(12 * Math.sin(x / 14))) < 2) { raw[i] = 23; raw[i + 1] = 27; raw[i + 2] = 64; raw[i + 3] = 255; }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return 'data:image/png;base64,' + Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}

// Serves the website folder like GitHub Pages does.
function startSite() {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, SITE).pathname);
    let file = path.join(SITE_DIR, p);
    if (!file.startsWith(SITE_DIR)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(fs.readFileSync(path.join(SITE_DIR, '404.html'))); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(PORT.site, '127.0.0.1', () => r(server)));
}

// The Worker as it will run live, but pointed at the local stand-ins.
const TEST_VARS = {
  ...SECRETS, SITE_ORIGIN: SITE, STRIPE_API_BASE: MOCK, RESEND_API_BASE: MOCK, ALLOW_DRAFT_AGREEMENT: 'true',
  BANK_ACCOUNT_NAME: 'Properfy Ltd', BANK_SORT_CODE: '04-00-04', BANK_ACCOUNT_NUMBER: '12345678'
};

async function startWorker(port = PORT.worker, vars = TEST_VARS) {
  // Never test against a server left over from another run.
  if (await fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false)) throw new Error(`Port ${port} is already in use. Stop the other server and try again.`);
  const persist = path.join(API_DIR, '.wrangler', `test-state-${port}-${Date.now()}`);
  const env = { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' };
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'properfy-onboarding', '--local', '--persist-to', persist, '--file', 'schema.sql'], { cwd: API_DIR, env, stdio: 'ignore' });
  // Pass every var on the command line, blank where unset, so wrangler.toml's placeholders don't apply.
  const all = { SITE_ORIGIN: SITE, BANK_ACCOUNT_NAME: '', BANK_SORT_CODE: '', BANK_ACCOUNT_NUMBER: '', ...vars };
  const args = ['wrangler', 'dev', '--local', '--port', String(port), '--inspector-port', String(port + 1000), '--ip', '127.0.0.1', '--persist-to', persist, '--test-scheduled'];
  for (const [k, v] of Object.entries(all)) args.push('--var', `${k}:${v}`);
  // Its own process group, so stopping it also stops wrangler's workerd.
  const proc = spawn('npx', args, { cwd: API_DIR, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const stop = () => { try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* already stopped */ } };
  let log = '';
  proc.stdout.on('data', (d) => { log += d; });
  proc.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/api/health`); if (r.ok) return { stop, log: () => log }; } catch { /* starting */ }
    await sleep(500);
  }
  stop();
  throw new Error('Worker did not start:\n' + log);
}

const post = (p, body, headers = {}) => fetch(API + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const mockState = async () => (await fetch(`${MOCK}/_state`)).json();
const validBody = (o = {}) => ({
  transaction: 'purchase', name: 'Sam Taylor', email: 'sam@example.com', postcode: 'e8 3pl', agreementVersion: AGREEMENT.version,
  acceptAgreement: true, earlyStart: false, signature: { method: 'drawn', image: testPng() }, paymentMethod: 'bank', ...o
});

async function apiTests() {
  section('API: validation');
  const cases = [
    ['refuses a Scottish postcode', { postcode: 'EH1 1YZ' }, 400, /Scotland/],
    ['refuses a Northern Irish postcode', { postcode: 'BT1 1AA' }, 400, /Northern Ireland/],
    ['accepts TD15 (Berwick, England)', { postcode: 'TD15 1AA' }, 200, null],
    ['requires the agreement to be accepted', { acceptAgreement: false }, 400, /accept the agreement/],
    ['rejects an out-of-date agreement version', { agreementVersion: 'old' }, 409, /updated/],
    ['requires a signature', { signature: { method: 'drawn', image: 'data:image/png;base64,AAAA' } }, 400, /sign/],
    ['rejects an unknown transaction', { transaction: 'mortgage' }, 400, /transaction/],
    ['rejects a bad email', { email: 'nope' }, 400, /email/],
    ['requires a payment method', { paymentMethod: 'cash' }, 400, /pay/]
  ];
  for (const [name, o, status, re] of cases) {
    const r = await post('/api/onboarding', validBody(o));
    const j = await r.json();
    check(name, r.status === status && (!re || re.test(j.error)), `${r.status} ${j.error || ''}`);
  }
  const hp = await (await post('/api/onboarding', validBody({ website: 'spam' }))).json();
  check('ignores bots that fill the hidden field', hp.ignored === true);

  section('API: bank transfer, no early start');
  let r = await post('/api/onboarding', validBody({ transaction: 'sale', earlyStart: false }), { 'User-Agent': 'TestAgent/1.0', 'CF-Connecting-IP': '203.0.113.9' });
  const bank = await r.json();
  check('signs and returns a reference', r.ok && /^PFY-[A-Z0-9]{6}$/.test(bank.id), JSON.stringify(bank).slice(0, 200));
  check('payment is pending', bank.paymentStatus === 'pending_bank');
  check('returns Tide details with the postcode as reference', bank.bank && bank.bank.reference === 'E8 3PL' && bank.bank.sortCode === '04-00-04' && bank.bank.amount === '£295.00');
  check('agreement was emailed', bank.agreementEmailed === true);
  let st = await mockState();
  const agreementMails = st.emails.filter((e) => /signed/.test(e.subject) && e.subject.includes(bank.id));
  const clientMail = agreementMails.find((e) => e.to[0] === 'sam@example.com');
  const officeMail = agreementMails.find((e) => e.to[0] === 'info@properfy.co.uk');
  check('client gets the signed PDF', clientMail && clientMail.attachments && clientMail.attachments[0].filename === `Properfy-agreement-${bank.id}.pdf`);
  check('info@properfy.co.uk gets the signed PDF', officeMail && officeMail.attachments && officeMail.attachments.length === 1);
  const pdf = Buffer.from(clientMail.attachments[0].content, 'base64');
  fs.writeFileSync(path.join(OUT_DIR, 'agreement-bank.pdf'), pdf);
  check('attachment is a real PDF', pdf.subarray(0, 5).toString() === '%PDF-');
  check('office email says when work may begin', /Work may begin/.test(officeMail.html) && !/Now<\/strong>/.test(officeMail.html));
  check('client email has the bank details', /04-00-04/.test(clientMail.html) && /E8 3PL/.test(clientMail.html));

  section('API: status and private access');
  r = await fetch(`${API}/api/onboarding/${bank.id}?token=wrong`);
  check('status needs the private token', r.status === 404);
  r = await fetch(`${API}/api/onboarding/${bank.id}?token=${bank.token}`);
  check('status works with the token', r.ok && (await r.json()).paymentStatus === 'pending_bank');
  r = await fetch(`${API}/agreements/${bank.id}.pdf`);
  check('PDFs are not served publicly', r.status === 404);
  r = await fetch(`${API}/admin/agreement?id=${bank.id}&sig=bad`);
  check('admin links need a valid signature', r.status === 403);
  const link = (re) => { const mm = officeMail.html.match(re); return mm && mm[1].replace(/&amp;/g, '&'); };
  const pdfLink = link(/href="([^"]*\/admin\/agreement[^"]*)"/);
  r = await fetch(pdfLink);
  check('Properfy’s signed link downloads the PDF', r.ok && r.headers.get('content-type') === 'application/pdf');
  const confirm = link(/href="([^"]*\/admin\/confirm-bank[^"]*)"/);
  r = await fetch(confirm);
  const confirmPage = await r.text();
  check('opening the confirm link does not mark it paid', /Confirm bank transfer received/.test(confirmPage));
  r = await fetch(`${API}/api/onboarding/${bank.id}?token=${bank.token}`);
  check('still pending after opening the link', (await r.json()).paymentStatus === 'pending_bank');
  r = await fetch(confirm, { method: 'POST' });
  check('pressing the button confirms the transfer', /Bank transfer confirmed/.test(await r.text()));
  r = await fetch(`${API}/api/onboarding/${bank.id}?token=${bank.token}`);
  const afterConfirm = await r.json();
  check('now marked as paid', afterConfirm.paymentStatus === 'paid', JSON.stringify(afterConfirm));
  st = await mockState();
  check('client is told the payment arrived', st.emails.some((e) => e.to[0] === 'sam@example.com' && /Payment received/.test(e.subject)));

  section('API: card payment and verified webhooks');
  r = await post('/api/onboarding', validBody({ transaction: 'purchase', paymentMethod: 'card', earlyStart: true, signature: { method: 'typed', image: testPng(), typedName: 'Sam Taylor' } }));
  const card = await r.json();
  check('returns a Stripe Checkout link', r.ok && /\/checkout\/cs_test_/.test(card.checkoutUrl || ''), JSON.stringify(card).slice(0, 200));
  st = await mockState();
  const session = st.stripeCalls[st.stripeCalls.length - 1];
  check('checkout is for £595 in GBP', session.amount_total === 59500 && session.currency === 'gbp' && session.mode === 'payment');
  check('checkout is tied to the reference', session.client_reference_id === card.id && session.metadata.onboarding_id === card.id);
  check('checkout returns to /get-started/', session.success_url.startsWith(`${SITE}/get-started/?id=${card.id}&t=`) && /cancelled=1/.test(session.cancel_url));
  const ev = JSON.stringify(checkoutCompletedEvent(session));
  r = await post('/api/stripe/webhook', ev, { 'Stripe-Signature': signWebhook(ev, 'whsec_wrong') });
  check('rejects a webhook with a bad signature', r.status === 400);
  r = await post('/api/stripe/webhook', ev, { 'Stripe-Signature': signWebhook(ev, SECRETS.STRIPE_WEBHOOK_SECRET, Math.floor(Date.now() / 1000) - 3600) });
  check('rejects an old (replayed) webhook', r.status === 400);
  const wrongAmount = JSON.stringify(checkoutCompletedEvent(session, { amount_total: 100 }));
  r = await post('/api/stripe/webhook', wrongAmount, { 'Stripe-Signature': signWebhook(wrongAmount, SECRETS.STRIPE_WEBHOOK_SECRET) });
  let s2 = await (await fetch(`${API}/api/onboarding/${card.id}?token=${card.token}`)).json();
  check('ignores a payment for the wrong amount', r.ok && s2.paymentStatus === 'awaiting_card');
  r = await post('/api/stripe/webhook', ev, { 'Stripe-Signature': signWebhook(ev, SECRETS.STRIPE_WEBHOOK_SECRET) });
  s2 = await (await fetch(`${API}/api/onboarding/${card.id}?token=${card.token}`)).json();
  check('a verified webhook marks it paid', r.ok && s2.paymentStatus === 'paid');
  r = await post('/api/stripe/webhook', ev, { 'Stripe-Signature': signWebhook(ev, SECRETS.STRIPE_WEBHOOK_SECRET) });
  st = await mockState();
  check('a repeated webhook is ignored', /Already processed/.test(await r.text()) && st.emails.filter((e) => e.to[0] === 'sam@example.com' && /Payment received/.test(e.subject)).length === 2);
  const cardMail = st.emails.find((e) => e.to[0] === 'info@properfy.co.uk' && e.subject.includes(card.id) && /signed/.test(e.subject));
  check('office email shows the early-start request', /Early start requested<\/td><td[^>]*><strong>Yes/.test(cardMail.html));
  fs.writeFileSync(path.join(OUT_DIR, 'agreement-card.pdf'), Buffer.from(cardMail.attachments[0].content, 'base64'));

  section('API: daily start-date reminder');
  const runCron = async (daysAhead) => {
    const before = (await mockState()).emails.length;
    const t = Date.now() + daysAhead * 86400000;
    const res = await fetch(`${API}/cdn-cgi/handler/scheduled?cron=0+7+*+*+*&time=${t}`);
    if (!res.ok) throw new Error('Scheduled run failed: ' + res.status);
    for (let i = 0; i < 20; i++) {
      await sleep(250);
      const sent = (await mockState()).emails.slice(before).filter((e) => /You can now start work/.test(e.subject));
      if (sent.length) return sent;
    }
    return [];
  };
  let reminders = await runCron(14);
  check('no reminder while the cancellation period is running', reminders.length === 0, reminders.map((e) => e.subject).join(', '));
  reminders = await runCron(15);
  const reminder = reminders[0];
  check('the day it ends, info@properfy.co.uk is told work can start', reminders.length === 1 && reminder.to[0] === 'info@properfy.co.uk' && reminder.html.includes(bank.id));
  check('clients who asked for an early start are left out', reminder && !reminder.html.includes(card.id));
  reminders = await runCron(15);
  check('each client is only included once', reminders.length === 0);

  section('API: abuse limits');
  const signUp = (o, ip) => post('/api/onboarding', validBody(o), { 'CF-Connecting-IP': ip });
  const byEmail = [];
  for (let i = 1; i <= 6; i++) byEmail.push((await signUp({ email: 'busy@example.com' }, `198.51.100.${i}`)).status);
  check('the same email can sign 5 times an hour, not 6', byEmail.slice(0, 5).every((x) => x === 200) && byEmail[5] === 429, byEmail.join(','));
  const byIp = [];
  for (let i = 1; i <= 11; i++) byIp.push((await signUp({ email: `person${i}@example.com` }, '198.51.100.99')).status);
  check('one connection can sign 10 times an hour, not 11', byIp.slice(0, 10).every((x) => x === 200) && byIp[10] === 429, byIp.join(','));
  r = await signUp({ email: 'someone.else@example.com' }, '198.51.100.100');
  check('other people are not affected', r.status === 200);
}

// The live Worker refuses sign-ups until the agreement is final and every
// secret and bank detail is set.
async function safetyTests() {
  section('API: safety switches');
  const started = await Promise.allSettled([
    startWorker(PORT.draft, { ...TEST_VARS, ALLOW_DRAFT_AGREEMENT: '' }),
    startWorker(PORT.unset, { SITE_ORIGIN: SITE, ALLOW_DRAFT_AGREEMENT: 'true', ADMIN_SECRET: 'too-short', BANK_SORT_CODE: '[sort code]' })
  ]);
  const [draft, unset] = started.map((x) => x.value);
  try {
    const failed = started.find((x) => x.status === 'rejected');
    if (failed) throw failed.reason;
    const signUp = (port) => fetch(`http://127.0.0.1:${port}/api/onboarding`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify(validBody()) });
    let r = await signUp(PORT.draft);
    check('a draft agreement can’t be signed', r.status === 503 && /isn’t open yet/.test((await r.json()).error));
    r = await signUp(PORT.unset);
    check('sign-ups stay closed until the keys and bank details are set', r.status === 503 && /isn’t available/.test((await r.json()).error));
    const said = /Not configured: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, BANK_ACCOUNT_NAME, BANK_SORT_CODE, BANK_ACCOUNT_NUMBER, ADMIN_SECRET/;
    for (let i = 0; i < 10 && !said.test(unset.log()); i++) await sleep(200);
    check('the log says what’s missing', said.test(unset.log()), unset.log().slice(-400));
    r = await fetch(`http://127.0.0.1:${PORT.unset}/admin/confirm-bank?id=PFY-AAAAAA&sig=x`);
    check('admin links are switched off without a strong ADMIN_SECRET', r.status === 503);
    const ev = JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed', data: { object: {} } });
    r = await fetch(`http://127.0.0.1:${PORT.unset}/api/stripe/webhook`, { method: 'POST', body: ev, headers: { 'Stripe-Signature': signWebhook(ev, 'anything') } });
    check('webhooks are refused without the signing secret', r.status === 400);
  } finally {
    for (const w of [draft, unset]) if (w) w.stop();
  }
}

async function uiTests() {
  let chromium;
  try { ({ chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright')); } catch {
    console.log('\n(Playwright not installed: skipping browser tests. Set PLAYWRIGHT_PATH to run them.)');
    return;
  }
  const browser = await chromium.launch();
  const errors = [];
  const newPage = async (width = 1280) => {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    await p.addInitScript((api) => { window.PFY_ONBOARDING_API = api; }, API);
    p.on('pageerror', (e) => errors.push(e.message));
    return p;
  };
  const sign = async (p) => {
    const box = await p.locator('[data-sig-canvas]').boundingBox();
    await p.mouse.move(box.x + 30, box.y + 100); await p.mouse.down();
    for (let i = 0; i <= 24; i++) await p.mouse.move(box.x + 30 + i * 10, box.y + 90 - Math.sin(i / 2.5) * 30, { steps: 2 });
    await p.mouse.up();
  };
  const fill = async (p, tx, { postcode = 'SW1A 1AA', name = 'Alex Morgan', email = 'alex@example.com' } = {}) => {
    await p.locator(`input[value="${tx}"]`).check({ force: true });
    await p.fill('input[name="name"]', name);
    await p.fill('input[name="email"]', email);
    await p.fill('input[name="postcode"]', postcode);
  };
  const err = (p) => p.locator('[data-gs-err] span').textContent();

  section('Browser: validation');
  let p = await newPage();
  await p.goto(`${SITE}/get-started/`);
  await p.click('[data-gs-submit]');
  check('asks for a transaction first', /choose your transaction/.test(await err(p)));
  await fill(p, 'purchase', { postcode: 'G1 1AA' });
  await p.click('[data-gs-submit]');
  check('refuses a Scottish postcode', /Scotland/.test(await err(p)));
  await p.fill('input[name="postcode"]', 'SW1A 1AA');
  await p.click('[data-gs-submit]');
  check('requires the agreement box', /accept the agreement/.test(await err(p)));
  await p.locator('input[name="accept"]').check();
  await p.click('[data-gs-submit]');
  check('requires a signature', /draw your signature/.test(await err(p)));
  check('summary shows the fee', (await p.locator('[data-sum-fee]').textContent()) === '£595');
  check('button shows the amount', /Sign and pay £595 securely/.test(await p.locator('[data-gs-submit]').textContent()));
  await p.locator('input[name="earlyStart"]').check();
  check('early start updates the summary', (await p.locator('[data-sum-start]').textContent()) === 'Straight away');
  await p.close();

  section('Browser: card payment');
  p = await newPage();
  await p.goto(`${SITE}/get-started/`);
  await fill(p, 'purchase');
  await p.locator('input[name="accept"]').check();
  await sign(p);
  await Promise.all([p.waitForURL(/\/checkout\/cs_test_/), p.click('[data-gs-submit]')]);
  check('goes to secure checkout for £595', (await p.locator('[data-amount]').textContent()) === '595.00 GBP');
  await Promise.all([p.waitForURL(/get-started\/\?/), p.click('#pay')]);
  await p.waitForSelector('[data-gs-done]:not([hidden])');
  await p.waitForFunction(() => /received your payment/.test(document.querySelector('[data-done-lead]').textContent), null, { timeout: 15000 });
  check('thank-you confirms payment', (await p.locator('[data-done-title]').textContent()) === 'Thank you, Alex.');
  check('says Properfy will be in touch', await p.locator('text=Properfy will be in touch with the next steps.').isVisible());
  check('confirms the emailed copy', /emailed to alex@example.com/.test(await p.locator('[data-done-emailed]').textContent()));
  check('the private link is taken out of the address bar', p.url() === `${SITE}/get-started/?paid=1`, p.url());
  await p.screenshot({ path: path.join(OUT_DIR, 'ui-card-done.png'), fullPage: true });
  await p.reload();
  await p.waitForFunction(() => /received your payment/.test(document.querySelector('[data-done-lead]').textContent), null, { timeout: 15000 });
  check('reloading keeps the thank-you', await p.locator('[data-gs-done]').isVisible() && await p.locator('[data-gs-form]').isHidden());
  await p.close();
  p = await newPage();
  await p.goto(`${SITE}/get-started/?paid=1`);
  await p.waitForTimeout(800);
  check('the thank-you can’t be opened in another tab without the private link', await p.locator('[data-gs-form]').isVisible() && await p.locator('[data-gs-done]').isHidden());
  await p.close();

  section('Browser: bank transfer with a typed signature');
  p = await newPage(390);
  await p.goto(`${SITE}/get-started/`);
  await fill(p, 'remortgage', { postcode: 'cf10 1aa', name: 'Jo Black', email: 'jo@example.com' });
  await p.locator('input[name="accept"]').check();
  await p.click('[data-sig-mode="type"]');
  check('typed signature uses their name', (await p.inputValue('input[name="typedSignature"]')) === 'Jo Black');
  await p.locator('input[value="bank"]').check({ force: true });
  check('button changes for bank transfer', /Sign and get bank details/.test(await p.locator('[data-gs-submit]').textContent()));
  check('no sideways scrolling on a phone', await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await p.click('[data-gs-submit]');
  await p.waitForSelector('[data-gs-done]:not([hidden])');
  check('shows the Tide details', (await p.locator('[data-bank="sortCode"]').textContent()) === '04-00-04');
  check('reference is the postcode', (await p.locator('[data-bank="reference"]').textContent()) === 'CF10 1AA');
  check('says payment is pending', /pending/.test(await p.locator('[data-done-bank]').textContent()));
  await p.screenshot({ path: path.join(OUT_DIR, 'ui-bank-done-mobile.png'), fullPage: true });
  check('address bar has no private details', p.url() === `${SITE}/get-started/?done=1`, p.url());
  await p.reload();
  await p.waitForSelector('[data-done-bank]:not([hidden])');
  check('reloading shows the bank details again, not a blank form', (await p.locator('[data-bank="reference"]').textContent()) === 'CF10 1AA' && await p.locator('[data-gs-form]').isHidden());
  await p.close();

  section('Browser: cancelled card payment');
  p = await newPage();
  await p.goto(`${SITE}/get-started/`);
  await fill(p, 'toe', { name: 'Kim Lee', email: 'kim@example.com' });
  await p.locator('input[name="accept"]').check();
  await sign(p);
  await Promise.all([p.waitForURL(/\/checkout\/cs_test_/), p.click('[data-gs-submit]')]);
  await Promise.all([p.waitForURL(/cancelled=1/), p.click('#cancel')]);
  await p.waitForSelector('[data-done-retry]:not([hidden])');
  check('offers to try again', /hasn’t been completed/.test(await p.locator('[data-done-lead]').textContent()));
  check('address bar has no private details after cancelling', p.url() === `${SITE}/get-started/?cancelled=1`, p.url());
  await p.click('[data-retry-bank]');
  await p.waitForSelector('[data-done-bank]:not([hidden])');
  check('can switch to bank transfer', (await p.locator('[data-bank="amount"]').textContent()) === '£295.00');
  await p.close();

  check('no script errors in the browser', errors.length === 0, errors.join(' | '));
  await browser.close();
}

const mocks = await startMocks({ port: PORT.mock, workerUrl: API, webhookSecret: SECRETS.STRIPE_WEBHOOK_SECRET, stripeKey: SECRETS.STRIPE_SECRET_KEY, resendKey: SECRETS.RESEND_API_KEY });
const site = await startSite();
let worker;
try {
  worker = await startWorker();
  await apiTests();
  await safetyTests();
  await uiTests();
} catch (e) {
  failures++;
  console.error(e);
  if (worker) console.error(worker.log().slice(-3000));
} finally {
  if (worker) worker.stop();
  await sleep(500);
  mocks.server.close();
  for (const d of fs.readdirSync(path.join(API_DIR, '.wrangler'))) if (d.startsWith('test-state-')) fs.rmSync(path.join(API_DIR, '.wrangler', d), { recursive: true, force: true });
  site.close();
}
console.log(`\n${passes} passed, ${failures} failed. Output in ${OUT_DIR}`);
process.exit(failures ? 1 : 0);
