/*
  Properfy onboarding API (Cloudflare Worker)

  Backs properfy.co.uk/get-started:
    POST /api/onboarding                  sign the agreement (PDF saved, emailed) and choose a payment method
    GET  /api/onboarding/:id?token=…      status for the thank-you screen
    POST /api/onboarding/:id/checkout     start (or restart) Stripe card checkout
    POST /api/onboarding/:id/bank         switch to bank transfer
    POST /api/stripe/webhook              verified Stripe events mark card payments as paid
    GET  /admin/agreement?id=…&sig=…      Properfy downloads a signed PDF (signed link, emailed to Properfy only)
    GET|POST /admin/confirm-bank?id=…&sig=…  Properfy marks a bank transfer as received

  Records are kept in D1 (DB) and signed PDFs in a private R2 bucket
  (AGREEMENTS). Nothing is publicly readable: clients get their PDF by email,
  and Properfy's links are signed with ADMIN_SECRET.
*/
import AGREEMENT from '../agreement.json';
import LOGO from '../assets/logo.png';
import { buildAgreementPdf, formatPounds, ukDate, ukTime } from './pdf.js';
import { createCheckoutSession, verifyStripeSignature } from './stripe.js';
import { sendEmail, toBase64 } from './email.js';
import { checkPostcode } from './postcode.js';

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (data) => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
const hmac = async (secret, msg) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
};
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const first = (name) => String(name).trim().split(/\s+/)[0];

const AGREEMENT_SHA = sha256(JSON.stringify(AGREEMENT));
// Every piece of text in the agreement. A "[…]" in any of it is a blank still to fill in.
const agreementText = (A) => [A.title, A.subtitle, A.acceptConsent, A.earlyStartConsent, ...[A.intro, ...A.sections.map((s) => [s.heading, ...s.blocks]), A.closing, A.appendix]
  .flat().filter(Boolean).flatMap((b) => (typeof b === 'string' ? [b] : b.h ? [b.h] : b.list || (b.table ? b.table.flat() : [])))];
const AGREEMENT_BLANKS = agreementText(AGREEMENT).join('\n').match(/\[[^\]\n]+\]/g) || [];
// Only a final agreement with no blanks can be signed (ALLOW_DRAFT_AGREEMENT is for tests).
const AGREEMENT_READY = AGREEMENT.status === 'final' && !AGREEMENT_BLANKS.length;
const FEES = Object.fromEntries(AGREEMENT.fees.map((f) => [f.id, f]));

// Reference shown to clients and Properfy, e.g. PFY-7K2QXD.
const newId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(6));
  return 'PFY-' + [...b].map((x) => chars[x % chars.length]).join('');
};

// The UK date the cooling-off (cancellation) period ends, 14 days after the
// day the contract is made, and the first day work may begin without an
// early-start request.
function coolingOff(signedAt, days) {
  const ukDay = new Date(signedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
  const d = new Date(ukDay + 'T12:00:00Z');
  const end = new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10);
  const start = new Date(d.getTime() + (days + 1) * 86400000).toISOString().slice(0, 10);
  return { end, start };
}

/* ── HTTP helpers ─────────────────────────────────────────────────────── */

function cors(env, req) {
  const allowed = [env.SITE_ORIGIN].concat((env.EXTRA_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean));
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : env.SITE_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}
const json = (env, req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(env, req) } });
const fail = (env, req, message, status = 400, extra = {}) => json(env, req, { ok: false, error: message, ...extra }, status);
const page = (title, body, status = 200) => new Response(`<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;background:#171b40;color:#e9e9ed;font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;display:grid;place-items:center;min-height:100vh;padding:20px;box-sizing:border-box}main{max-width:520px;width:100%;background:#232532;border-radius:14px;padding:28px;box-shadow:0 0 0 1px #3f424d}h1{font-size:22px;font-weight:500;margin:0 0 10px}p{margin:0 0 12px;color:#cfd3e5}dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0 0 18px}dt{color:#9397ab}dd{margin:0}button{font:inherit;color:#9184d9;background:transparent;border:1px solid #9184d9;border-radius:8px;padding:10px 18px;cursor:pointer}button:hover{background:rgba(145,132,217,.12)}.ok{color:#1fd67a}</style></head><body><main>${body}</main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });

// Properfy serves England and Wales only, so connections from outside the UK
// (Cloudflare's country code GB) are refused. ALLOWED_COUNTRIES is in wrangler.toml.
function outsideUk(env, req) {
  const allowed = String(env.ALLOWED_COUNTRIES ?? 'GB').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return !allowed.includes(String((req.cf && req.cf.country) || '').toUpperCase());
}
const UK_ONLY = 'Properfy only works with clients in England and Wales, so online sign-up isn’t available from outside the UK. If you’re in the UK and using a VPN, turn it off and try again.';

// Everything that must be set before sign-ups open: the secrets (wrangler
// secret put) and the Tide details (wrangler.toml).
const adminReady = (env) => String(env.ADMIN_SECRET || '').length >= 32;
function notConfigured(env) {
  const need = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'BANK_ACCOUNT_NAME', 'BANK_SORT_CODE', 'BANK_ACCOUNT_NUMBER']
    .filter((n) => !env[n] || /^\s*(\[.*\])?\s*$/.test(env[n]));
  if (!adminReady(env)) need.push('ADMIN_SECRET (at least 32 characters)');
  return need;
}

async function logEvent(env, id, type, detail) {
  await env.DB.prepare('INSERT INTO events (onboarding_id, at, type, detail) VALUES (?, ?, ?, ?)').bind(id, nowIso(), type, detail ? JSON.stringify(detail) : null).run();
}
const getRec = (env, id) => env.DB.prepare('SELECT * FROM onboardings WHERE id = ?').bind(id).first();
async function authRec(env, id, token) {
  if (!id || !token) return null;
  const rec = await getRec(env, id);
  if (!rec) return null;
  return rec.token_hash === await sha256(String(token)) ? rec : null;
}
const adminLink = async (env, path, id) => `${env.API_ORIGIN}${path}?id=${encodeURIComponent(id)}&sig=${await hmac(env.ADMIN_SECRET, `${path}:${id}`)}`;
const adminOk = async (env, path, id, sig) => !!id && !!sig && sig === await hmac(env.ADMIN_SECRET, `${path}:${id}`);

const bankDetails = (env, rec) => ({
  accountName: env.BANK_ACCOUNT_NAME, sortCode: env.BANK_SORT_CODE, accountNumber: env.BANK_ACCOUNT_NUMBER,
  amount: formatPounds(rec.amount_pence), reference: rec.property_postcode
});
const publicStatus = (env, rec) => ({
  ok: true, id: rec.id, firstName: first(rec.client_name), email: rec.client_email, transaction: rec.transaction_label,
  amount: formatPounds(rec.amount_pence), paymentMethod: rec.payment_method, paymentStatus: rec.payment_status,
  agreementEmailed: rec.agreement_email_status === 'sent',
  bank: rec.payment_method === 'bank' ? bankDetails(env, rec) : undefined
});

/* ── Emails ───────────────────────────────────────────────────────────── */

const wrapEmail = (inner) => `<div style="font-family:Arial,Helvetica,sans-serif;color:#222433;font-size:15px;line-height:1.55;max-width:560px">${inner}<p style="color:#6b6f80;font-size:12px;margin-top:28px">Properfy · info@properfy.co.uk · 020 3475 2007 · properfy.co.uk</p></div>`;
const bankHtml = (b) => `<table style="border-collapse:collapse;margin:8px 0 14px">${[['Account name', b.accountName], ['Sort code', b.sortCode], ['Account number', b.accountNumber], ['Amount', b.amount], ['Reference', b.reference]].map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#6b6f80">${k}</td><td style="padding:3px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>`;
const startLine = (rec) => rec.early_start_requested
  ? 'You asked us to start work during your 14-day cooling-off period, so we can begin straight away.'
  : `You didn’t ask us to start early, so we won’t begin work until your 14-day cooling-off period ends on ${ukDate(rec.cancellation_period_ends)}.`;

async function emailAgreement(env, rec, pdfBytes) {
  const attachment = [{ filename: `Properfy-agreement-${rec.id}.pdf`, content: toBase64(pdfBytes) }];
  const payLine = rec.payment_method === 'bank'
    ? `<p>To make your initial payment by bank transfer, please send <strong>${formatPounds(rec.amount_pence)}</strong> using your property’s postcode as the reference:</p>${bankHtml(bankDetails(env, rec))}<p>Your payment will show as pending until we’ve confirmed it.</p>`
    : `<p>Your initial payment of <strong>${formatPounds(rec.amount_pence)}</strong> is being made securely by card through Stripe. We’ll email you when it’s confirmed.</p>`;
  await sendEmail(env, {
    to: rec.client_email, replyTo: env.OFFICE_EMAIL,
    subject: `Your signed Properfy agreement (${rec.id})`,
    html: wrapEmail(`<p>Dear ${esc(first(rec.client_name))},</p><p>Thank you for choosing Properfy. Your property journey starts here, and we’ll support you every step of the way.</p><p>A copy of your signed <strong>${esc(AGREEMENT.title)}</strong> is attached for your records.</p>${payLine}<p>${esc(startLine(rec))}</p><p>We’ll be in touch with the next steps.</p><p>Your reference: <strong>${rec.id}</strong></p>`),
    attachments: attachment
  });
  const links = rec.payment_method === 'bank'
    ? `<p><a href="${await adminLink(env, '/admin/confirm-bank', rec.id)}">Mark the bank transfer as received</a> (only once it’s in the Tide account).</p>` : '';
  await sendEmail(env, {
    to: env.OFFICE_EMAIL, replyTo: rec.client_email,
    subject: `New signed agreement: ${rec.transaction_label} · ${rec.client_name} (${rec.property_postcode}) · ${rec.id}`,
    html: wrapEmail(`<p><strong>${esc(rec.client_name)}</strong> has signed the ${esc(AGREEMENT.title)} (version ${esc(rec.agreement_version)}).</p>
      <table style="border-collapse:collapse">${[
        ['Reference', rec.id], ['Transaction', rec.transaction_label], ['Initial payment', formatPounds(rec.amount_pence)], ['Email', rec.client_email],
        ['Property postcode', rec.property_postcode], ['Payment', rec.payment_method === 'card' ? 'Card (Stripe) · awaiting payment' : 'Bank transfer · pending'],
        ['Signed', ukTime(rec.signed_at)], ['Early start requested', rec.early_start_requested ? 'Yes' : 'No'],
        ['Work may begin', rec.early_start_requested ? 'Now' : `${ukDate(rec.services_may_start)} (cooling-off period ends ${ukDate(rec.cancellation_period_ends)})`]
      ].map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#6b6f80">${k}</td><td style="padding:3px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
      ${links}<p><a href="${await adminLink(env, '/admin/agreement', rec.id)}">Download the signed agreement</a> (also attached).</p>`),
    attachments: attachment
  });
}

async function emailPaid(env, rec) {
  await sendEmail(env, {
    to: rec.client_email, replyTo: env.OFFICE_EMAIL,
    subject: `Payment received – thank you (${rec.id})`,
    html: wrapEmail(`<p>Dear ${esc(first(rec.client_name))},</p><p>We’ve received your initial payment of <strong>${formatPounds(rec.amount_pence)}</strong> for your ${esc(rec.transaction_label.toLowerCase())}. Thank you.</p><p>${esc(startLine(rec))}</p><p>We’ll be in touch with the next steps.</p><p>Your reference: <strong>${rec.id}</strong></p>`)
  });
  await sendEmail(env, {
    to: env.OFFICE_EMAIL,
    subject: `Paid (${rec.payment_method === 'card' ? 'card' : 'bank transfer'}): ${rec.client_name} · ${rec.transaction_label} · ${rec.id}`,
    html: wrapEmail(`<p><strong>${esc(rec.client_name)}</strong> has paid ${formatPounds(rec.amount_pence)} by ${rec.payment_method === 'card' ? 'card (confirmed by Stripe)' : 'bank transfer (confirmed by Properfy)'}.</p><p>Work may begin: <strong>${rec.early_start_requested ? 'now (early start requested)' : ukDate(rec.services_may_start)}</strong>.</p>`)
  });
}

async function markPaid(env, rec, by, stripe = {}) {
  const at = nowIso();
  const res = await env.DB.prepare(`UPDATE onboardings SET payment_status = 'paid', paid_at = ?, paid_confirmed_by = ?, stripe_session_id = COALESCE(?, stripe_session_id), stripe_payment_intent = COALESCE(?, stripe_payment_intent), updated_at = ? WHERE id = ? AND payment_status != 'paid'`)
    .bind(at, by, stripe.session || null, stripe.paymentIntent || null, at, rec.id).run();
  if (!res.meta.changes) return false; // already paid
  await logEvent(env, rec.id, 'paid', { by, ...stripe });
  const fresh = await getRec(env, rec.id);
  try { await emailPaid(env, fresh); } catch (e) { await logEvent(env, rec.id, 'email_failed', { kind: 'paid', error: String(e.message || e) }); }
  return true;
}

/* ── Handlers ─────────────────────────────────────────────────────────── */

async function startCheckout(env, rec, token) {
  const site = env.SITE_ORIGIN + '/get-started/';
  const q = `id=${encodeURIComponent(rec.id)}&t=${encodeURIComponent(token)}`;
  const session = await createCheckoutSession(env, rec, { success: `${site}?${q}&paid=1`, cancel: `${site}?${q}&cancelled=1` });
  await env.DB.prepare(`UPDATE onboardings SET payment_method = 'card', payment_status = 'awaiting_card', stripe_session_id = ?, updated_at = ? WHERE id = ?`).bind(session.id, nowIso(), rec.id).run();
  await logEvent(env, rec.id, 'checkout_created', { session: session.id });
  return session.url;
}

async function createOnboarding(env, req) {
  if (!AGREEMENT_READY && env.ALLOW_DRAFT_AGREEMENT !== 'true') {
    if (AGREEMENT_BLANKS.length) console.error('Agreement has blanks to fill in: ' + AGREEMENT_BLANKS.join(', '));
    return fail(env, req, 'Online onboarding isn’t open yet. Please call us on 020 3475 2007.', 503);
  }
  const notSet = notConfigured(env);
  if (notSet.length) { console.error('Not configured: ' + notSet.join(', ')); return fail(env, req, 'Online onboarding isn’t available just now. Please call us on 020 3475 2007.', 503); }
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > 600000) return fail(env, req, 'That request was too large.', 413);
  let b;
  try { b = await req.json(); } catch { return fail(env, req, 'Something went wrong. Please try again.'); }
  if (b.website) return json(env, req, { ok: true, ignored: true }); // honeypot

  const fee = FEES[b.transaction];
  if (!fee) return fail(env, req, 'Please choose your transaction.', 400, { field: 'transaction' });
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 100) return fail(env, req, 'Please add your full name.', 400, { field: 'name' });
  const email = String(b.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return fail(env, req, 'That email doesn’t look quite right.', 400, { field: 'email' });
  const area = checkPostcode(b.postcode);
  if (!area.ok) return fail(env, req, area.message, 400, { field: 'postcode' });
  if (b.agreementVersion !== AGREEMENT.version) return fail(env, req, 'The agreement has been updated. Please reload the page to see the latest version.', 409);
  if (b.acceptAgreement !== true) return fail(env, req, 'Please tick the box to accept the agreement.', 400, { field: 'accept' });
  const method = b.paymentMethod === 'bank' ? 'bank' : b.paymentMethod === 'card' ? 'card' : null;
  if (!method) return fail(env, req, 'Please choose how you’d like to pay.', 400, { field: 'payment' });
  const sigMethod = b.signature && b.signature.method === 'typed' ? 'typed' : 'drawn';
  const m = String(b.signature && b.signature.image || '').match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m || m[1].length > 400000) return fail(env, req, 'Please sign the agreement.', 400, { field: 'signature' });
  const signaturePng = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
  if (signaturePng.length < 200 || signaturePng[0] !== 0x89 || signaturePng[1] !== 0x50) return fail(env, req, 'Please sign the agreement.', 400, { field: 'signature' });

  const ip = req.headers.get('CF-Connecting-IP');
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const recent = await env.DB.prepare('SELECT SUM(CASE WHEN signer_ip = ? THEN 1 ELSE 0 END) AS by_ip, SUM(CASE WHEN lower(client_email) = lower(?) THEN 1 ELSE 0 END) AS by_email FROM onboardings WHERE created_at > ?').bind(ip, email, hourAgo).first();
  if ((ip && recent.by_ip >= 10) || recent.by_email >= 5) return fail(env, req, 'You’ve already sent a few agreements recently. Please call us on 020 3475 2007 and we’ll help.', 429);

  const signedAt = nowIso();
  const co = coolingOff(signedAt, AGREEMENT.coolingOffDays);
  const token = randomHex(24);
  let id = newId();
  while (await getRec(env, id)) id = newId();
  const agreementSha = await AGREEMENT_SHA;
  const rec = {
    id, token_hash: await sha256(token), created_at: signedAt, transaction_type: fee.id, transaction_label: fee.label, amount_pence: fee.amountPence,
    client_name: name, client_email: email, property_postcode: area.postcode,
    agreement_version: AGREEMENT.version, agreement_sha256: agreementSha, agreement_accepted: 1, early_start_requested: b.earlyStart === true ? 1 : 0,
    cancellation_period_ends: co.end, services_may_start: b.earlyStart === true ? signedAt.slice(0, 10) : co.start,
    signature_method: sigMethod, signature_typed_name: sigMethod === 'typed' ? String(b.signature.typedName || name).slice(0, 100) : null,
    signed_at: signedAt, signer_ip: ip || null, signer_user_agent: (req.headers.get('User-Agent') || '').slice(0, 400),
    pdf_key: `agreements/${id}.pdf`, pdf_sha256: '', payment_method: method, payment_status: method === 'bank' ? 'pending_bank' : 'awaiting_card',
    agreement_email_status: 'pending', updated_at: signedAt
  };

  const pdfBytes = await buildAgreementPdf({ agreement: AGREEMENT, agreementSha256: agreementSha, rec, signaturePng, logoPng: LOGO });
  rec.pdf_sha256 = await sha256(pdfBytes);
  await env.AGREEMENTS.put(rec.pdf_key, pdfBytes, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { id, client: name, sha256: rec.pdf_sha256 } });
  await env.AGREEMENTS.put(`signatures/${id}.png`, signaturePng, { httpMetadata: { contentType: 'image/png' } });
  const cols = Object.keys(rec);
  await env.DB.prepare(`INSERT INTO onboardings (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...cols.map((c) => rec[c])).run();
  await logEvent(env, id, 'signed', { agreementVersion: rec.agreement_version, earlyStart: !!rec.early_start_requested, method, signature: sigMethod });

  try {
    await emailAgreement(env, rec, pdfBytes);
    rec.agreement_email_status = 'sent';
  } catch (e) {
    rec.agreement_email_status = 'failed';
    await logEvent(env, id, 'email_failed', { kind: 'agreement', error: String(e.message || e) });
  }
  await env.DB.prepare('UPDATE onboardings SET agreement_email_status = ?, updated_at = ? WHERE id = ?').bind(rec.agreement_email_status, nowIso(), id).run();

  const out = { ...publicStatus(env, rec), token };
  if (method === 'card') {
    try { out.checkoutUrl = await startCheckout(env, rec, token); } catch (e) {
      await logEvent(env, id, 'checkout_failed', { error: String(e.message || e) });
      out.checkoutError = 'Card payment isn’t available just now. You can try again, or pay by bank transfer.';
    }
  }
  return json(env, req, out);
}

async function handleWebhook(env, req) {
  const payload = await req.text();
  if (!await verifyStripeSignature(payload, req.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET)) return new Response('Invalid signature', { status: 400 });
  const event = JSON.parse(payload);
  const seen = await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?').bind(event.id).first();
  if (seen) return new Response('Already processed', { status: 200 });
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    const id = s.client_reference_id || (s.metadata && s.metadata.onboarding_id);
    const rec = id && await getRec(env, id);
    if (!rec) await logEvent(env, id || null, 'webhook_unknown', { event: event.id });
    else if (s.payment_status !== 'paid') await logEvent(env, id, 'webhook_unpaid', { event: event.id, status: s.payment_status });
    else if (s.amount_total !== rec.amount_pence || String(s.currency).toLowerCase() !== 'gbp') await logEvent(env, id, 'webhook_amount_mismatch', { event: event.id, amount: s.amount_total, currency: s.currency });
    else await markPaid(env, rec, 'stripe', { session: s.id, paymentIntent: s.payment_intent, event: event.id });
  }
  await env.DB.prepare('INSERT INTO stripe_events (id, type, received_at) VALUES (?, ?, ?)').bind(event.id, event.type, nowIso()).run();
  return new Response('ok', { status: 200 });
}

async function handleAdmin(env, req, url) {
  if (!adminReady(env)) return page('Not set up', '<h1>Not set up yet</h1><p>ADMIN_SECRET is missing or too short.</p>', 503);
  const path = url.pathname, id = url.searchParams.get('id'), sig = url.searchParams.get('sig');
  if (!await adminOk(env, path, id, sig)) return page('Link not valid', '<h1>This link isn’t valid</h1><p>Use the link from the Properfy email.</p>', 403);
  const rec = await getRec(env, id);
  if (!rec) return page('Not found', '<h1>Agreement not found</h1>', 404);

  if (path === '/admin/agreement') {
    const obj = await env.AGREEMENTS.get(rec.pdf_key);
    if (!obj) return page('Not found', '<h1>PDF not found</h1>', 404);
    return new Response(obj.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Properfy-agreement-${rec.id}.pdf"`, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  // /admin/confirm-bank: GET shows the details; POST (the button) confirms.
  // A button is used so email link scanners can't confirm a payment by opening the link.
  const details = `<dl><dt>Reference</dt><dd>${esc(rec.id)}</dd><dt>Client</dt><dd>${esc(rec.client_name)}</dd><dt>Transaction</dt><dd>${esc(rec.transaction_label)}</dd><dt>Amount</dt><dd>${formatPounds(rec.amount_pence)}</dd><dt>Bank reference</dt><dd>${esc(rec.property_postcode)}</dd><dt>Status</dt><dd>${rec.payment_status === 'paid' ? '<span class="ok">Paid</span>' : 'Pending'}</dd></dl>`;
  if (rec.payment_status === 'paid') return page('Already paid', `<h1>Already marked as paid</h1>${details}`);
  if (rec.payment_method !== 'bank') return page('Not a bank transfer', `<h1>This client chose card payment</h1>${details}<p>Card payments are confirmed automatically by Stripe.</p>`);
  if (req.method === 'POST') {
    await markPaid(env, rec, 'properfy');
    return page('Payment confirmed', `<h1 class="ok">Bank transfer confirmed</h1>${details.replace('Pending', '<span class="ok">Paid</span>')}<p>We’ve emailed ${esc(rec.client_email)} to say their payment has been received.</p>`);
  }
  return page('Confirm bank transfer', `<h1>Confirm bank transfer received?</h1>${details}<p>Only confirm once the money is in the Tide account.</p><form method="post"><button type="submit">Yes, mark as paid</button></form>`);
}

// Runs every morning (see [triggers] in wrangler.toml): tells Properfy whose
// cooling-off period has ended, for clients who didn't ask for an early start.
async function sendStartReminders(env, today) {
  const due = (await env.DB.prepare(`SELECT * FROM onboardings WHERE early_start_requested = 0 AND services_may_start <= ? AND start_reminder_sent_at IS NULL ORDER BY services_may_start`).bind(today).all()).results;
  if (!due.length) return 0;
  const rows = due.map((r) => `<tr><td style="padding:4px 14px 4px 0"><strong>${esc(r.id)}</strong></td><td style="padding:4px 14px 4px 0">${esc(r.client_name)}</td><td style="padding:4px 14px 4px 0">${esc(r.transaction_label)}</td><td style="padding:4px 14px 4px 0">${esc(r.property_postcode)}</td><td style="padding:4px 0">${r.payment_status === 'paid' ? 'Paid' : 'Payment pending'}</td></tr>`).join('');
  await sendEmail(env, {
    to: env.OFFICE_EMAIL,
    subject: `You can now start work for ${due.length} client${due.length > 1 ? 's' : ''}`,
    html: wrapEmail(`<p>The 14-day cooling-off period has ended for these clients, who didn’t ask for an early start. You can now begin work.</p><table style="border-collapse:collapse;font-size:14px">${rows}</table>`)
  });
  const at = nowIso();
  for (const r of due) {
    await env.DB.prepare('UPDATE onboardings SET start_reminder_sent_at = ?, updated_at = ? WHERE id = ?').bind(at, at, r.id).run();
    await logEvent(env, r.id, 'start_reminder_sent');
  }
  return due.length;
}

export default {
  async scheduled(event, env, ctx) {
    const today = new Date(event.scheduledTime || Date.now()).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    ctx.waitUntil(sendStartReminders(env, today).catch((e) => console.error('Start reminders failed', e)));
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    env.API_ORIGIN = env.API_ORIGIN || url.origin;
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, req) });
      // Stripe calls the webhook from its own servers abroad; every call is signature-checked.
      if (url.pathname !== '/api/stripe/webhook' && outsideUk(env, req)) {
        return url.pathname.startsWith('/admin/') ? page('Not available', `<h1>Not available outside the UK</h1><p>${esc(UK_ONLY)}</p>`, 403) : fail(env, req, UK_ONLY, 403);
      }
      if (url.pathname === '/api/health') return json(env, req, { ok: true, agreementVersion: AGREEMENT.version, agreementStatus: AGREEMENT.status, agreementReady: AGREEMENT_READY });
      if (url.pathname === '/api/stripe/webhook' && req.method === 'POST') return await handleWebhook(env, req);
      if (url.pathname.startsWith('/admin/')) return await handleAdmin(env, req, url);
      if (url.pathname === '/api/onboarding' && req.method === 'POST') return await createOnboarding(env, req);

      const m = url.pathname.match(/^\/api\/onboarding\/(PFY-[A-Z0-9]{6})(\/checkout|\/bank)?$/);
      if (m) {
        const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
        const token = body.token || url.searchParams.get('token');
        const rec = await authRec(env, m[1], token);
        if (!rec) return fail(env, req, 'We couldn’t find that agreement.', 404);
        if (!m[2] && req.method === 'GET') return json(env, req, publicStatus(env, rec));
        if (rec.payment_status === 'paid') return json(env, req, publicStatus(env, rec));
        if (m[2] === '/checkout' && req.method === 'POST') {
          try { return json(env, req, { ...publicStatus(env, rec), checkoutUrl: await startCheckout(env, rec, token) }); } catch (e) {
            await logEvent(env, rec.id, 'checkout_failed', { error: String(e.message || e) });
            return fail(env, req, 'Card payment isn’t available just now. Please try again, or pay by bank transfer.', 502);
          }
        }
        if (m[2] === '/bank' && req.method === 'POST') {
          await env.DB.prepare(`UPDATE onboardings SET payment_method = 'bank', payment_status = 'pending_bank', updated_at = ? WHERE id = ?`).bind(nowIso(), rec.id).run();
          await logEvent(env, rec.id, 'switched_to_bank');
          const fresh = await getRec(env, rec.id);
          try {
            await sendEmail(env, { to: fresh.client_email, replyTo: env.OFFICE_EMAIL, subject: `Bank transfer details (${fresh.id})`, html: wrapEmail(`<p>Dear ${esc(first(fresh.client_name))},</p><p>Please send <strong>${formatPounds(fresh.amount_pence)}</strong> using your property’s postcode as the reference:</p>${bankHtml(bankDetails(env, fresh))}<p>Your payment will show as pending until we’ve confirmed it.</p>`) });
            await sendEmail(env, { to: env.OFFICE_EMAIL, subject: `Bank transfer chosen: ${fresh.client_name} · ${fresh.id}`, html: wrapEmail(`<p>${esc(fresh.client_name)} will pay ${formatPounds(fresh.amount_pence)} by bank transfer, reference ${esc(fresh.property_postcode)}.</p><p><a href="${await adminLink(env, '/admin/confirm-bank', fresh.id)}">Mark the bank transfer as received</a></p>`) });
          } catch (e) { await logEvent(env, rec.id, 'email_failed', { kind: 'bank', error: String(e.message || e) }); }
          return json(env, req, publicStatus(env, fresh));
        }
      }
      return fail(env, req, 'Not found', 404);
    } catch (e) {
      console.error(e);
      return fail(env, req, 'Something went wrong on our side. Please try again, or call us on 020 3475 2007.', 500);
    }
  }
};
