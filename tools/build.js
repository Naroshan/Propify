#!/usr/bin/env node
/*
  Properfy — page builder

  Builds every page of the site from assets/js/data.js, following the
  "Properfy Website" design. Run it after changing content:

    node tools/build.js

  It writes plain HTML files (no build step is needed to serve them), so the
  site works on GitHub Pages or any static host. Interactive parts (the
  enquiry form, search, checklists, chips) are handled by assets/js/site.js.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), sandbox);
const P = sandbox.window.PFY;
const U = P.ui;
const CFG = P.config;
const ICONS = require('./icons.js');

const NEON = U.neon;
const JCOL = { buy: NEON[0], sell: NEON[3], buysell: NEON[2], ltb: NEON[5], toe: NEON[1] };
const SVCCOL = { conveyancing: NEON[2], mortgages: NEON[1], surveys: NEON[0], removals: NEON[4], moving: NEON[5], auction: NEON[3], toe: NEON[1], newbuild: NEON[4], so: NEON[2], finance: NEON[5] };
const SVC_KEYS = ['conveyancing', 'mortgages', 'surveys', 'removals', 'moving', 'auction', 'toe', 'newbuild', 'so', 'finance'];
const RAINBOW = 'linear-gradient(90deg,#29b6f6,#1fd67a,#a259ff,#ff2e9a,#ff7a2f,#ffe135)';
const FADE = 'var(--fade-rule)';

/* ── Helpers ────────────────────────────────────────────────────────────── */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const attrJson = (o) => esc(JSON.stringify(o));
const pad2 = (n) => String(n).padStart(2, '0');
const num = (arr) => arr.map((t, i) => ({ n: pad2(i + 1), t }));
const bg = (c1, c2) => `radial-gradient(ellipse 50% 85% at 95% 0%,${c1}38,transparent 70%),radial-gradient(ellipse 45% 70% at 0% 100%,${c2}26,transparent 70%),var(--grid-bg)`;
const short = (id) => { const a = P.guides[id].answer; const i = a.indexOf('. '); return i > 0 ? a.slice(0, i + 1) : a; };
const cat = (id) => P.cats.find((c) => c.id === id);

// Icons come from a per-page SVG sprite; `used` collects what each page needs.
// Icons the enquiry form and menus draw in script are always included.
const ALWAYS = ['x', 'arrow-right', 'phone', 'warning-circle', 'check-circle-fill', 'check', 'list', 'caret-right', 'caret-down'];
let used;
function ic(cls, style, attrs) {
  let name = String(cls).replace(/^ph ph-/, '');
  if (/^ph-fill ph-/.test(name)) name = name.replace(/^ph-fill ph-/, '') + '-fill';
  if (!ICONS[name]) throw new Error('Missing icon: ' + name);
  used.add(name);
  return `<svg class="ph"${style ? ` style="${style}"` : ''} aria-hidden="true"${attrs || ''}><use href="#i-${name}"/></svg>`;
}
function sprite() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    [...used].sort().map((n) => `<symbol id="i-${n}" viewBox="0 0 1024 1024"><path transform="matrix(1 0 0 -1 0 960)" d="${ICONS[n]}"/></symbol>`).join('') +
    '</defs></svg>';
}

// Page addresses. Guides live one folder down (e.g. conveyancing/…), so every
// link is written relative to the page it appears on.
const FILE = {
  home: 'index.html', hub: 'property-hub.html', specialist: 'specialist-property-transactions.html',
  checklists: 'checklists.html', glossary: 'glossary.html', about: 'about.html',
  quick: P.quick.slug + '.html', repo: P.repo.slug + '.html',
  privacy: 'privacy.html', complaints: 'complaints.html', partners: 'partners.html'
};
const jFile = (k) => P.journeys[k].slug + '.html';
const sFile = (k) => P.services[k].slug + '.html';
const gFile = (id) => cat(P.guides[id].cat).root + '/' + P.guides[id].slug + '.html';
const HUB_PAGES = { leasehold: 'leasehold.html', exchange: 'exchange-and-completion.html', ftb: 'first-time-buyers.html' };
const hubFile = (catId) => HUB_PAGES[catId] || 'property-hub.html?cat=' + catId;

let base = ''; // '' at the root, '../' one folder down, '/' for the 404 page
const u = (f) => base + f;

// "svc:auction", "journey:ltb", "guide:leasehold", "hub:ftb" or "lead".
function linkAttrs(to) {
  const [t, id] = to.split(':');
  if (t === 'svc') return `href="${u(sFile(id))}"`;
  if (t === 'guide') return `href="${u(gFile(id))}"`;
  if (t === 'journey') return `href="${u(jFile(id))}"`;
  if (t === 'hub') return `href="${u(hubFile(id))}"`;
  if (t === 'lead') return 'href="#tell-us" data-lead="move"';
  return `href="${u(to + '.html')}"`;
}

const svcMenu = SVC_KEYS.map((k) => ({
  label: P.services[k].h1.replace(/^Get an? /, '').replace(/^\w/, (c) => c.toUpperCase()),
  icon: P.svc[k].icon,
  href: sFile(k)
}));

/* ── Shared frame ───────────────────────────────────────────────────────── */

function wordmark() {
  const st = 'stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" fill="none"';
  const puffs = [0, 1, 2].map((i) => `<circle class="wm-puff" cx="16.7" cy="0.8" r="${(1.1 + i * 0.25).toFixed(2)}" fill="var(--color-accent-300)" style="animation-delay:${(i * 0.18).toFixed(2)}s"/>`).join('');
  return `<span class="wordmark" aria-hidden="true"><span class="wm-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="overflow:visible"><path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5z" ${st}/><path d="M15.5 6.3V2.8h2.4v5.4" ${st}/><path d="M9.5 20.5v-5.5h5v5.5" ${st}/>${puffs}</svg></span><span class="wm-word">Proper<span class="wm-letter"><span class="wm-face" data-face="f">f</span><span class="wm-face" data-face="t" style="opacity:0">t</span></span>y</span></span>`;
}

function header(active) {
  const nav = [
    { label: 'Buying', href: jFile('buy'), key: 'buy' },
    { label: 'Selling', href: jFile('sell'), key: 'sell' },
    { label: 'Services', menu: true, key: 'service' },
    { label: 'Sell fast', href: FILE.quick, key: 'quick' },
    { label: 'Repossession help', href: FILE.repo, key: 'repo' },
    { label: 'Property Hub', href: FILE.hub, key: 'hub' },
    { label: 'About', href: FILE.about, key: 'about' }
  ];
  const navHtml = nav.map((l) => l.menu
    ? `<button type="button" class="nav-link" data-svc-toggle aria-expanded="false" aria-controls="svc-menu"${active === l.key ? ' style="color:var(--color-text)"' : ''}>${l.label}${ic('caret-down', 'font-size:12px')}</button>`
    : `<a class="nav-link" href="${u(l.href)}"${active === l.key ? ' aria-current="page"' : ''}>${l.label}</a>`).join('');
  const mobile = [
    { label: 'Sell your house fast', href: FILE.quick },
    { label: 'Repossession help', href: FILE.repo },
    ...Object.keys(P.journeys).map((k) => ({ label: P.journeys[k].title, href: jFile(k) })),
    ...['conveyancing', 'mortgages', 'surveys', 'removals', 'moving'].map((k) => ({ label: P.svc[k].label === 'Utilities, insurance & more' ? 'Moving home services' : P.svc[k].label, href: sFile(k) })),
    { label: 'Specialist transactions', href: FILE.specialist },
    { label: 'Property Hub', href: FILE.hub },
    { label: 'Checklists', href: FILE.checklists },
    { label: 'About', href: FILE.about }
  ];
  const menuItems = svcMenu.concat([{ label: 'All specialist transactions', icon: 'ph ph-puzzle-piece', href: FILE.specialist }]);
  return `<header class="site-header">
  <div style="max-width:1180px;margin:0 auto;padding:12px var(--pad-x);display:flex;align-items:center;gap:22px;box-sizing:border-box">
    <a href="${u(FILE.home)}" class="lk" style="margin-right:auto;display:flex;align-items:center" aria-label="Properfy home">${wordmark()}</a>
    <nav class="desk-nav" aria-label="Main">${navHtml}</nav>
    <button type="button" class="btn btn-primary" data-lead="move" style="white-space:nowrap"><span class="cta-long">Tell us about my move</span><span class="cta-short">Get help</span></button>
    <button type="button" class="btn btn-ghost btn-icon burger" data-burger aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu">${ic('list', 'font-size:20px')}</button>
  </div>
  <div class="svc-menu" id="svc-menu" hidden>
    <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 16px;box-sizing:border-box">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px;padding:10px;border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-md)">
        ${menuItems.map((m) => `<a class="lk hv-800" href="${u(m.href)}" style="display:flex;gap:10px;align-items:center;padding:10px;border-radius:8px">${ic(m.icon, 'font-size:18px;color:var(--color-accent)')}<span style="font-size:14px">${esc(m.label)}</span></a>`).join('\n        ')}
      </div>
    </div>
  </div>
  <nav class="mobile-menu" id="mobile-menu" aria-label="Site menu" hidden>
    <div style="padding:8px var(--pad-x) 18px;display:flex;flex-direction:column;gap:2px">
      ${mobile.map((l) => `<a class="lk" href="${u(l.href)}" style="padding:12px 4px;font-size:16px;display:flex;justify-content:space-between;align-items:center;background:${FADE}">${esc(l.label)}${ic('caret-right', 'color:var(--color-neutral-500)')}</a>`).join('\n      ')}
    </div>
  </nav>
<div style="height:1px;background:${RAINBOW};opacity:.85"></div></header>`;
}

function crumbs(list) {
  if (!list) return '';
  const all = [{ label: 'Home', href: FILE.home }].concat(list);
  return `<div class="wrap crumbs" style="padding:16px var(--pad-x) 0">
    <nav aria-label="Breadcrumb" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;color:var(--color-neutral-400)">
      ${all.map((c, i) => {
        const last = i === all.length - 1;
        const color = last ? 'var(--color-neutral-200)' : 'var(--color-neutral-400)';
        const inner = c.href ? `<a class="lk" href="${u(c.href)}" style="color:${color}">${esc(c.label)}</a>`
          : c.svc ? `<button type="button" class="lk" data-svc-toggle style="color:${color};font-size:12px">${esc(c.label)}</button>`
          : `<span style="color:${color}"${last ? ' aria-current="page"' : ''}>${esc(c.label)}</span>`;
        return `<span style="display:flex;gap:6px;align-items:center">${inner}${last ? '' : ic('caret-right', 'font-size:10px;color:var(--color-neutral-600)')}</span>`;
      }).join('')}
    </nav>
  </div>`;
}

function band() {
  return `<section class="wrap band" style="padding:var(--band-outer)">
    <div style="padding:var(--band-pad);border-radius:14px;background:radial-gradient(ellipse 45% 110% at 100% 0%,rgba(255,46,154,.38),transparent 70%),radial-gradient(ellipse 45% 110% at 0% 100%,rgba(41,182,246,.32),transparent 70%),var(--color-section);box-shadow:0 0 0 1px rgba(162,89,255,.35),0 0 40px rgba(162,89,255,.2);display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
      <div style="flex:1 1 360px;display:flex;flex-direction:column;gap:10px">
        <h2 class="h2">Tell us about your move</h2>
        <p style="margin:0;font-size:16px;color:var(--color-neutral-100);max-width:560px;line-height:1.55;text-wrap:pretty">Buying, selling, remortgaging or simply not sure where to start? Tell us what you’re trying to do and we’ll help you work out what you need.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-lead="move" class="btn btn-primary" style="height:48px;padding:0 22px;font-size:15px;color:var(--color-text);border-color:var(--color-text)">Tell us about my move${ic('arrow-right')}</button><button type="button" data-lead="callback" class="btn btn-ghost" style="height:48px;color:var(--color-text)">${ic('phone')}Request a callback</button></div>
    </div>
  </section>`;
}

function footer() {
  const cols = [
    { t: 'Journeys', links: Object.keys(P.journeys).map((k) => ({ label: P.journeys[k].title, href: jFile(k) })).concat([{ label: 'Sell your house fast', href: FILE.quick }, { label: 'Repossession help', href: FILE.repo }]) },
    { t: 'Services', links: svcMenu.slice(0, 6) },
    { t: 'Specialist', links: svcMenu.slice(5).concat([{ label: 'All specialist transactions', href: FILE.specialist }]) },
    { t: 'Property Hub', links: [{ label: 'Property questions', href: FILE.hub }, { label: 'First-time buyers', href: HUB_PAGES.ftb }, { label: 'Checklists', href: FILE.checklists }, { label: 'Glossary', href: FILE.glossary }, { label: 'About Properfy', href: FILE.about }] }
  ];
  const c = CFG.contact;
  const legal = 'style="color:var(--color-neutral-500);text-decoration:none"';
  return `<footer class="site-footer" style="margin-top:12px;background:var(--color-neutral-900)"><div style="height:2px;background:${RAINBOW};box-shadow:0 0 14px rgba(162,89,255,.6)"></div>
  <div style="max-width:1180px;margin:0 auto;padding:40px var(--pad-x) 28px;box-sizing:border-box;display:flex;flex-direction:column;gap:28px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:24px">
      ${cols.map((col) => `<div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-400)">${col.t}</span>${col.links.map((l) => `<a class="hv-text" href="${u(l.href)}" style="font-size:14px;color:var(--color-neutral-200);text-decoration:none">${esc(l.label)}</a>`).join('')}</div>`).join('\n      ')}
    </div>
    <p style="margin:0;font-size:12px;line-height:1.6;color:var(--color-neutral-500);max-width:860px">Properfy is an introducer. We don’t provide legal services, mortgage advice or surveys ourselves; these are provided by the professionals we introduce you to, who are responsible for their advice. We may receive a referral fee from partners, and we’ll tell you before you’re introduced. Your home may be repossessed if you do not keep up repayments on your mortgage. Guides cover England and Wales unless stated and are general information, not advice.</p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:var(--color-neutral-500)">Properfy covers homes in England and Wales only. Call <a href="tel:${c.phoneHref}" style="color:var(--color-neutral-400);text-decoration:underline">${c.phone}</a> or email <a href="mailto:${c.email}" style="color:var(--color-neutral-400);text-decoration:underline">${c.email}</a>.</p>
    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:var(--color-neutral-500)"><span>© 2026 Properfy Ltd</span><a class="hv-text" href="${u(FILE.privacy)}" ${legal}>Privacy</a><a class="hv-text" href="${u(FILE.privacy)}#cookies" ${legal}>Cookies</a><a class="hv-text" href="${u(FILE.complaints)}" ${legal}>Complaints</a><a href="${u(FILE.partners)}" style="color:var(--color-neutral-400);text-decoration:underline">Partner login</a></div>
  </div>
</footer>`;
}

function stickyCta() {
  return `<div class="sticky-cta">
    <button type="button" data-lead="move" class="btn btn-primary" style="flex:1;height:44px">Tell us about my move</button>
    <button type="button" data-lead="callback" class="btn btn-secondary btn-icon" style="width:44px;height:44px" aria-label="Request a callback">${ic('phone', 'font-size:18px')}</button>
  </div>`;
}

const DEFAULT_TITLE = 'Properfy · Everything you need to move home, in one place';
const DEFAULT_DESC = 'Buying, selling or moving home? Properfy helps you understand what you need to do next and connects you with the right professionals.';
const ORG_LD = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Properfy', url: 'https://properfy.co.uk' };
const faqLd = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

const built = [];
function write(file, o) {
  base = o.base != null ? o.base : '../'.repeat(file.split('/').length - 1);
  used = new Set(ALWAYS);
  const bodyHtml = o.body();
  const head = header(o.active);
  const foot = footer();
  const sticky = stickyCta();
  const crumb = crumbs(o.crumbs);
  const bandHtml = o.band === false ? '' : band();
  const canonical = CFG.site + '/' + (o.canonical != null ? o.canonical : file === 'index.html' ? '' : file);
  const title = o.title || DEFAULT_TITLE;
  const desc = o.desc || DEFAULT_DESC;
  const body = { page: o.page };
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${o.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#171b40">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Properfy">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<link rel="icon" href="${u('assets/img/favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${u('assets/fonts/inter-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${u('assets/fonts/sora-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('assets/css/site.css')}">
<script src="${u('assets/js/data.js')}" defer></script>
<script src="${u('assets/js/site.js')}" defer></script>
<script type="application/ld+json">${JSON.stringify(o.ld || ORG_LD).replace(/</g, '\\u003c')}</script>
</head>
<body data-page="${esc(o.page)}"${o.ctx ? ` data-ctx="${attrJson(o.ctx)}"` : ''}${o.landing ? ' data-landing="1"' : ''}>
${sprite()}
<a class="skip" href="#main">Skip to content</a>
<div class="frame">
${head}
<main id="main" style="flex:1">
${crumb}
${bodyHtml}
${bandHtml}
</main>
${foot}
${sticky}
</div>
<div class="toast" role="status" aria-live="polite"></div>
</body>
</html>
`;
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  built.push({ file, canonical, sitemap: o.sitemap !== false && !o.noindex && o.canonical == null });
}

/* ── Building blocks shared by several pages ────────────────────────────── */

const sectionHead = (kicker, h2, sub, balance) => `<div style="display:flex;flex-direction:column;gap:6px;max-width:640px"><span class="kicker">${kicker}</span><h2 class="h2"${balance ? ' style="text-wrap:balance"' : ''}>${h2}</h2>${sub ? `<p style="margin:0;font-size:15px;color:var(--color-neutral-400)">${sub}</p>` : ''}</div>`;
const faqRow = (f, more) => `<div style="padding:12px 0;display:flex;flex-direction:column;gap:4px;background:${FADE}"><h3 style="font-size:16px">${esc(f.q)}</h3><p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.55">${esc(f.a)}</p>${more || ''}</div>`;
const svcChips = (keys) => (keys || []).map((k) => `<a href="${u(sFile(k))}" class="tag tag-accent lk" style="gap:5px;color:var(--color-accent-100)">${ic(P.svc[k].icon)}${esc(P.svc[k].label)}</a>`).join('');
const howSteps = U.how.map((h, i) => ({ ...h, c: NEON[[0, 1, 3, 5][i]], glow: NEON[[0, 1, 3, 5][i]] + '88', n: pad2(i + 1), i: i + 1 }));
const explainsList = () => P.explains.map((id, i) => ({ c: NEON[(i + 3) % 6], title: P.guides[id].explains || P.guides[id].title, href: gFile(id) }));
const specGroups = () => P.specialist.map((g, gi) => { const c = NEON[[3, 1, 0, 4][gi % 4]]; return { ...g, c, items: g.items.map((it) => ({ ...it, c, dim: c + '66' })) }; });
const err = (attrs, color) => `<p class="form-err" role="alert" hidden ${attrs || ''} style="margin:0;font-size:13px;color:${color || 'var(--color-accent-200)'};display:flex;gap:6px;align-items:baseline">${ic('warning-circle')}<span></span></p>`;
const honeypot = () => '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>';
let fid = 0;
const field = (label, input) => { const id = 'f' + (++fid); return `<div class="field"><label for="${id}">${label}</label>${input.replace(/^<(input|select|textarea)/, `<$1 id="${id}"`)}</div>`; };
const select = (name, list, extra) => `<select class="input" name="${name}"${extra || ''}><option value="">Choose one</option>${list.map((v) => `<option>${esc(v)}</option>`).join('')}</select>`;

/* ── Home ───────────────────────────────────────────────────────────────── */

function homeBody() {
  const sit = P.situations.find((x) => x.id === 'offer');
  const journeyCards = Object.keys(P.journeys).map((k) => ({ ...P.journeys[k], k, c: JCOL[k], glow: JCOL[k] + '55', count: P.journeys[k].stages.length }));
  const homeServices = U.homeServices.map((h, i) => { const c = NEON[[2, 1, 0, 4, 5, 3, 0, 1, 2][i]]; return { ...h, c, glow: c + '40', href: h.to === 'checklists' ? FILE.checklists + '#address' : sFile(h.k) }; });
  return `<section style="background:${bg(NEON[3], NEON[0])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--hero-pad);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:44px;align-items:flex-start">
      <div style="flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:18px;padding-top:12px">
        <span class="kicker">Your property concierge</span>
        <h1 style="font-size:var(--h1);line-height:1.03;letter-spacing:-0.035em;text-wrap:balance">Everything you need to move home. In one place.</h1>
        <p style="margin:0;font-size:17px;line-height:1.6;color:var(--color-neutral-300);max-width:520px;text-wrap:pretty">Buying, selling and moving involves dozens of tasks, professionals and services. You don’t need to understand the property industry. Just tell us what you’re trying to do, and we’ll help you work out the next step.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" data-lead="move" class="btn btn-primary" style="height:46px;padding:0 20px;font-size:15px">Tell us about my move${ic('arrow-right')}</button>
          <a href="${u(FILE.hub)}" class="btn btn-secondary" style="height:46px;padding:0 20px;font-size:15px">${ic('question')}Ask a property question</a>
        </div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--color-neutral-400)">
          ${['No obligation', 'Plain English', 'Every step of your move'].map((t) => `<span style="display:flex;gap:6px;align-items:center">${ic('check', 'color:var(--color-accent)')}${t}</span>`).join('\n          ')}
        </div>
      </div>
      <div data-situations style="flex:1 1 380px;min-width:0;max-width:500px;padding:20px;border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:16px">
        <div style="display:flex;flex-direction:column;gap:4px"><h2 style="font-size:17px;font-weight:500;line-height:1.55;letter-spacing:0">Where are you in your move?</h2><span style="font-size:13px;color:var(--color-neutral-400)">Pick the one that sounds most like you.</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px" role="group" aria-label="Where are you in your move?">
          ${P.situations.map((x) => `<button type="button" class="chip" data-sit="${x.id}" aria-pressed="${x.id === sit.id}">${esc(x.label)}</button>`).join('\n          ')}
        </div>
        <div style="padding:14px;border-radius:8px;background:var(--color-bg);display:flex;flex-direction:column;gap:12px">
          <span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent)">What happens next?</span>
          <ol class="ul" data-sit-steps style="display:flex;flex-direction:column;gap:9px" aria-live="polite">
            ${sit.steps.map((t, i) => `<li style="display:flex;gap:12px;align-items:baseline"><span style="flex:none;width:18px;font-size:12px;color:var(--color-accent-300);font-variant-numeric:tabular-nums">${i + 1}</span><span style="font-size:14px">${esc(t)}</span></li>`).join('\n            ')}
          </ol>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" data-sit-cta data-lead="move" data-lead-extra="${attrJson({ doing: P.journeys.buy.doing, stage: 'Offer accepted' })}" class="btn btn-primary" style="height:40px"><span>${esc(sit.cta)}</span>${ic('arrow-right')}</button>
          <a data-sit-journey href="${u(jFile(sit.journey))}" class="btn btn-ghost" style="height:40px">See the full journey</a>
        </div>
      </div>
    </div>
  </section>

  <section style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x);box-sizing:border-box;width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:12px">
    <a href="${u(FILE.quick)}" class="lk hv-lift" style="padding:20px;border-radius:14px;background:rgba(8,10,34,0.7);box-shadow:inset 0 0 0 1.5px #ff7a2f,0 0 22px rgba(255,122,47,.28);display:flex;gap:16px;align-items:center">
      ${ic('lightning', 'font-size:34px;color:#ff7a2f;filter:drop-shadow(0 0 6px #ff7a2f)')}
      <div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:17px;font-weight:500">Need to sell quickly?</span><span style="font-size:14px;color:var(--color-neutral-300)">Cash buyers, auction or a fast-track sale, compared honestly.</span></div>
      ${ic('arrow-right', 'margin-left:auto;color:#ff7a2f')}
    </a>
    <a href="${u(FILE.repo)}" class="lk hv-lift" style="padding:20px;border-radius:14px;background:rgba(8,10,34,0.7);box-shadow:inset 0 0 0 1.5px #29b6f6,0 0 22px rgba(41,182,246,.25);display:flex;gap:16px;align-items:center">
      ${ic('lifebuoy', 'font-size:34px;color:#29b6f6;filter:drop-shadow(0 0 6px #29b6f6)')}
      <div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:17px;font-weight:500">Worried about repossession?</span><span style="font-size:14px;color:var(--color-neutral-300)">Confidential help to understand your options, fast.</span></div>
      ${ic('arrow-right', 'margin-left:auto;color:#29b6f6')}
    </a>
  </section>

  <div style="background:linear-gradient(180deg,rgba(90,100,200,.10),rgba(90,100,200,.04))"><section style="max-width:1180px;margin:0 auto;padding:var(--sec-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:22px;width:100%">
    ${sectionHead('Your journey', 'Five ways to move. Every step explained.', '', true)}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px">
      ${journeyCards.map((j) => `<a href="${u(jFile(j.k))}" class="card elev-sm lk hv-card" style="padding:18px;gap:10px">
          <div style="width:50px;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px ${j.c},0 0 16px ${j.glow}">${ic(j.icon, `font-size:25px;color:${j.c};filter:drop-shadow(0 0 5px ${j.c})`)}</div>
          <h3 class="card-title" style="margin:0;letter-spacing:0">${esc(j.title)}</h3>
          <p class="card-body" style="font-size:14px;margin:0;text-wrap:pretty">${esc(j.blurb)}</p>
          <span style="margin-top:auto;font-size:13px;color:${j.c};display:flex;gap:6px;align-items:center">${j.count} steps explained${ic('arrow-right')}</span>
        </a>`).join('\n      ')}
    </div>
  </section></div>

  <div style="background-color:#232862;background-image:linear-gradient(rgba(170,170,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(170,170,255,.09) 1px,transparent 1px);background-size:40px 40px;box-shadow:inset 0 1px 0 rgba(140,140,255,.12),inset 0 -1px 0 rgba(140,140,255,.12)"><section style="max-width:1180px;margin:0 auto;padding:var(--sec-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:22px;width:100%">
    ${sectionHead('Under one roof', 'Everything your move needs', 'Tell us what you need, or let us work it out with you.')}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">
      ${homeServices.map((h) => `<a href="${u(h.href)}" class="lk hv-lift" style="padding:18px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px ${h.c},0 0 18px ${h.glow};display:flex;gap:16px;align-items:center">
          ${ic(h.icon, `font-size:32px;color:${h.c};filter:drop-shadow(0 0 6px ${h.c})`)}
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:15px;font-weight:500">${esc(h.t)}</span><span style="font-size:13px;color:var(--color-neutral-400);line-height:1.45">${esc(h.d)}</span></div>
        </a>`).join('\n      ')}
    </div>
  </section></div>

  <div style="background:radial-gradient(ellipse 40% 80% at 100% 50%,rgba(162,89,255,.14),transparent 70%),radial-gradient(ellipse 40% 80% at 0% 50%,rgba(31,214,122,.10),transparent 70%)"><section style="max-width:1180px;margin:0 auto;padding:var(--sec-pad);box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:22px">
    ${sectionHead('How it works', 'You ask. We help you work it out.')}
    <ol class="ul" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:20px">
      ${howSteps.map((h) => `<li style="display:flex;flex-direction:column;gap:8px;padding-top:14px;background:linear-gradient(to right,${h.c},transparent 70%) no-repeat top/100% 2px"><span style="font-size:30px;font-weight:500;letter-spacing:-0.02em;color:${h.c};text-shadow:0 0 14px ${h.glow}">${h.n}</span><span style="font-size:17px;font-weight:500">${esc(h.t)}</span><span style="font-size:14px;color:var(--color-neutral-400);line-height:1.5">${esc(h.d)}</span></li>`).join('\n      ')}
    </ol>
  </section></div>

  <div style="background:linear-gradient(180deg,rgba(90,100,200,.10),rgba(90,100,200,.04))"><section style="max-width:1180px;margin:0 auto;padding:var(--sec-pad);box-sizing:border-box;width:100%">
    <div style="padding:var(--band-pad);border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-sm);display:flex;flex-wrap:wrap;gap:28px">
      <div style="flex:1 1 300px;display:flex;flex-direction:column;gap:12px">
        <span class="kicker">Specialist transactions</span>
        <h2 class="h2" style="text-wrap:balance">My transaction isn’t straightforward</h2>
        <p style="margin:0;font-size:15px;color:var(--color-neutral-300);text-wrap:pretty">Auctions, leasehold, new builds, shared ownership, bridging, probate and more. These need people who deal with them every day.</p>
        <div><a href="${u(FILE.specialist)}" class="btn btn-secondary" style="height:40px">Find my route${ic('arrow-right')}</a></div>
      </div>
      <div style="flex:2 1 420px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:16px">
        ${specGroups().map((g) => `<div style="display:flex;flex-direction:column;gap:8px">
            <span style="font-size:13px;color:var(--color-neutral-400);display:flex;gap:6px;align-items:center">${ic(g.i, `color:${g.c};filter:drop-shadow(0 0 5px ${g.c})`)}${esc(g.g)}</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${g.items.map((it) => `<a ${linkAttrs(it.to)} class="tag lk" style="background:transparent;color:${it.c};box-shadow:inset 0 0 0 1px ${it.dim}">${esc(it.t)}</a>`).join('')}
            </div>
          </div>`).join('\n        ')}
      </div>
    </div>
  </section></div>

  <div style="background-color:#232862;background-image:linear-gradient(rgba(170,170,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(170,170,255,.09) 1px,transparent 1px);background-size:40px 40px;box-shadow:inset 0 1px 0 rgba(140,140,255,.12),inset 0 -1px 0 rgba(140,140,255,.12)"><section style="max-width:1180px;margin:0 auto;padding:var(--sec-pad);box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:22px">
    ${sectionHead('The Properfy Property Hub', 'Have a property question?')}
    <form action="${u(FILE.hub)}" method="get" role="search" style="display:flex;gap:8px;max-width:640px">
      <div style="flex:1;position:relative">${ic('magnifying-glass', 'position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500)')}<input class="input" name="q" placeholder="What would you like to know?" style="padding-left:36px;height:46px;font-size:15px;width:100%;box-sizing:border-box" aria-label="Search property questions"></div>
      <button type="submit" class="btn btn-primary" style="height:46px">Search</button>
    </form>
    <div style="display:flex;flex-wrap:wrap;gap:20px">
      <div style="flex:1 1 360px;display:flex;flex-direction:column">
        <span style="font-size:13px;color:var(--color-neutral-400);margin-bottom:6px">Popular questions</span>
        ${P.popular.map((id) => `<a href="${u(gFile(id))}" class="lk hv-text" style="padding:12px 0;display:flex;justify-content:space-between;gap:12px;font-size:15px;background:${FADE}">${esc(P.guides[id].title)}${ic('arrow-right', 'color:var(--color-neutral-500)')}</a>`).join('\n        ')}
      </div>
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:10px">
        <span style="font-size:13px;color:var(--color-neutral-400)">Properfy Explains</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${explainsList().map((e) => `<a href="${u(e.href)}" class="lk hv-800" style="padding:14px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:6px"><span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${e.c}">Properfy Explains</span><span style="font-size:14px;font-weight:500;line-height:1.35">${esc(e.title)}</span></a>`).join('\n          ')}
        </div>
      </div>
    </div>
  </section></div>`;
}

/* ── Journeys ───────────────────────────────────────────────────────────── */

function journeyBody(k) {
  const J = { ...P.journeys[k], c: JCOL[k] };
  const STG = U.stages;
  const stages = J.stages.map((st, i) => ({ ...st, c: NEON[i % 6], glow: NEON[i % 6] + '55', id: 'stage-' + (i + 1), n: pad2(i + 1) }));
  return `<section style="background:${bg(J.c, NEON[2])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${J.c};display:flex;gap:8px;align-items:center">${ic(J.icon, 'font-size:16px')}${esc(J.title)}</span>
      <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em;max-width:820px;text-wrap:balance">${esc(J.h1)}</h1>
      <p style="margin:0;font-size:17px;line-height:1.6;color:var(--color-neutral-300);max-width:620px;text-wrap:pretty">${esc(J.intro)}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-lead="move" class="btn btn-primary" style="height:46px;padding:0 20px;font-size:15px">${esc(J.cta)}${ic('arrow-right')}</button><button type="button" data-lead="callback" class="btn btn-secondary" style="height:46px;padding:0 20px;font-size:15px">${ic('phone')}Request a callback</button></div>
    </div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:12px var(--pad-x) 40px;box-sizing:border-box;display:flex;gap:40px;align-items:flex-start">
    <nav class="rail" aria-label="Steps" style="flex:none;width:250px;position:sticky;top:80px;display:flex;flex-direction:column;gap:2px">
      <span style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-400);padding:0 10px 8px">${stages.length} steps</span>
      ${stages.map((s) => `<a href="#${s.id}" class="lk hv-surface" style="display:flex;gap:10px;padding:7px 10px;border-radius:8px;font-size:13px;color:var(--color-neutral-300)"><span style="flex:none;width:18px;color:${s.c};font-variant-numeric:tabular-nums">${s.n}</span>${esc(s.t)}</a>`).join('\n      ')}
    </nav>
    <ol class="ul" style="flex:1;min-width:0;display:flex;flex-direction:column">
      ${stages.map((s, i) => `<li id="${s.id}" style="display:flex;gap:16px;scroll-margin-top:90px">
          <div style="flex:none;display:flex;flex-direction:column;align-items:center;width:30px">
            <div style="width:32px;height:32px;border-radius:50%;box-shadow:inset 0 0 0 1.5px ${s.c},0 0 14px ${s.glow};display:flex;align-items:center;justify-content:center;font-size:12px;color:${s.c};font-variant-numeric:tabular-nums">${s.n}</div>
            <div style="flex:1;width:1px;background:linear-gradient(${s.c},var(--color-neutral-800))"></div>
          </div>
          <article style="flex:1;min-width:0;padding:2px 0 34px;display:flex;flex-direction:column;gap:14px">
            <h2 style="font-size:22px;letter-spacing:-0.02em;line-height:1.25">${esc(s.t)}</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:16px 24px">
              <div style="display:flex;flex-direction:column;gap:6px"><h3 style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-400)">What happens here?</h3><p style="margin:0;font-size:15px;line-height:1.55;text-wrap:pretty">${esc(s.h)}</p></div>
              <div style="display:flex;flex-direction:column;gap:6px"><h3 style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-400)">What should you be thinking about?</h3>
                <ul class="ul" style="display:flex;flex-direction:column;gap:6px">${s.k.map((t) => `<li style="display:flex;gap:8px;font-size:14px;line-height:1.45;color:var(--color-neutral-200)">${ic('check', 'color:var(--color-accent);margin-top:3px')}${esc(t)}</li>`).join('')}</ul></div>
            </div>
            ${s.next ? `<div style="padding:14px 16px;border-radius:8px;background:var(--color-accent-900);box-shadow:inset 0 0 0 1px var(--color-accent-700);display:flex;flex-direction:column;gap:10px">
                <span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent-200)">What happens next?</span>
                <ol class="ul" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(190px,100%),1fr));gap:8px 16px">${num(s.next).map((x) => `<li style="display:flex;gap:10px;font-size:14px"><span style="color:var(--color-accent-300);font-variant-numeric:tabular-nums">${x.n}</span>${esc(x.t)}</li>`).join('')}</ol>
                <div><button type="button" data-lead="move" data-lead-extra="${attrJson({ stage: STG[i < 6 ? 2 : 7] })}" class="btn btn-primary" style="height:36px">${esc(s.nextCta)}${ic('arrow-right')}</button></div>
              </div>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
              ${s.s.length ? '<span style="font-size:12px;color:var(--color-neutral-400);margin-right:2px">Properfy can help with</span>' : ''}${svcChips(s.s)}
              <button type="button" data-lead="callback" data-lead-extra="${attrJson({ topic: s.t })}" class="lk" style="margin-left:auto;font-size:13px;color:var(--color-accent-300);display:flex;gap:6px;align-items:center">${ic('phone')}Need help? Request a callback</button>
            </div>
          </article>
        </li>`).join('\n      ')}
    </ol>
  </div>
  <section style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:14px">
    <h2 style="font-size:24px;letter-spacing:-0.02em">Common questions</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:10px">
      ${J.guides.map((id) => `<a href="${u(gFile(id))}" class="lk hv-800" style="padding:14px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:6px"><span style="font-size:15px;font-weight:500">${esc(P.guides[id].title)}</span><span style="font-size:13px;color:var(--color-neutral-400);line-height:1.45">${esc(short(id))}</span></a>`).join('\n      ')}
    </div>
  </section>`;
}

/* ── Services ───────────────────────────────────────────────────────────── */

function quoteForm(S) {
  return `<div style="flex:1 1 340px;min-width:0;max-width:440px;padding:20px;border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:12px">
        <form data-form="quote" data-service="${S.key}" novalidate style="display:flex;flex-direction:column;gap:12px">
          <h2 style="font-size:18px;font-weight:500;line-height:1.55;letter-spacing:0">${esc(S.cta)}</h2>
          <span style="font-size:13px;color:var(--color-neutral-400);margin-top:-6px">Takes about a minute. No obligation.</span>
          ${field('Name', '<input class="input" name="name" placeholder="Your name" autocomplete="name">')}
          ${field('Phone', '<input class="input" name="phone" placeholder="07…" type="tel" autocomplete="tel">')}
          ${field('Email', '<input class="input" name="email" placeholder="you@example.com" type="email" autocomplete="email">')}
          ${field('Postcode', '<input class="input" name="postcode" placeholder="e.g. E8 3PL" autocomplete="postal-code" autocapitalize="characters">')}
          ${field('What stage are you at?', select('stage', U.stages))}
          ${honeypot()}
          ${err()}
          <button type="submit" class="btn btn-primary btn-block" style="height:44px;font-size:15px">${esc(S.cta)}${ic('arrow-right')}</button>
          <span style="font-size:11px;color:var(--color-neutral-500);line-height:1.5">We’ll use your details to contact you about this enquiry. See <a href="${u(FILE.about)}">how we handle enquiries</a>.</span>
        </form>
        <div data-sent hidden role="status" style="display:flex;flex-direction:column;gap:12px">
          ${ic('ph-fill ph-check-circle', 'font-size:30px;color:var(--color-accent)')}
          <span style="font-size:18px;font-weight:500">Thanks <span data-first></span>, we’ve got it.</span>
          <span style="font-size:14px;color:var(--color-neutral-300)">A member of our team will call you to understand your situation, then introduce the right professional. Your reference is <span data-ref></span>.</span>
        </div>
      </div>`;
}

function serviceBody(k) {
  const S0 = P.services[k];
  const S = { ...S0, top: (S0.included || []).slice(0, 3), included: S0.included || [], sections: (S0.sections || []).map((x, i) => ({ ...x, c: NEON[[5, 4, 0, 1, 3][i % 5]], glow: NEON[[5, 4, 0, 1, 3][i % 5]] + '40' })) };
  return `<section style="background:${bg(SVCCOL[k], NEON[2])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start">
      <div style="flex:1 1 400px;min-width:0;display:flex;flex-direction:column;gap:16px">
        <span class="kicker">${esc(S.kicker)}</span>
        <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em;text-wrap:balance">${esc(S.h1)}</h1>
        <p style="margin:0;font-size:17px;line-height:1.6;color:var(--color-neutral-300);max-width:560px;text-wrap:pretty">${esc(S.intro)}</p>
        <ul class="ul" style="display:flex;flex-direction:column;gap:8px">
          ${S.top.map((t) => `<li style="display:flex;gap:10px;font-size:15px">${ic('check-circle', 'color:var(--color-accent);font-size:18px')}${esc(t)}</li>`).join('')}
        </ul>
      </div>
      ${quoteForm(S)}
    </div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x);box-sizing:border-box;width:100%;display:flex;flex-direction:column">
    <section style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:18px">
      <h2 class="h2">Why Properfy?</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:16px">
        ${U.why.map((w) => `<div style="display:flex;flex-direction:column;gap:6px">${ic(w.i, 'font-size:22px;color:var(--color-accent)')}<span style="font-size:15px;font-weight:500">${esc(w.t)}</span><span style="font-size:14px;color:var(--color-neutral-400);line-height:1.5">${esc(w.d)}</span></div>`).join('')}
      </div>
    </section>
    <section style="padding:var(--sec-pad-y);display:flex;flex-wrap:wrap;gap:32px">
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:14px">
        <h2 class="h2">What’s included</h2>
        <ul class="ul" style="display:flex;flex-direction:column">${S.included.map((t) => `<li style="display:flex;gap:10px;padding:11px 0;font-size:15px;background:${FADE}">${ic('check', 'color:var(--color-accent);margin-top:3px')}${esc(t)}</li>`).join('')}</ul>
      </div>
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:14px">
        <h2 class="h2">How it works</h2>
        <ol class="ul" style="display:flex;flex-direction:column;gap:14px">${howSteps.map((h) => `<li style="display:flex;gap:14px"><span style="flex:none;width:26px;height:26px;border-radius:50%;box-shadow:inset 0 0 0 1.5px ${h.c},0 0 10px ${h.glow};display:flex;align-items:center;justify-content:center;font-size:12px;color:${h.c}">${h.i}</span><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:500">${esc(h.t)}</span><span style="font-size:14px;color:var(--color-neutral-400)">${esc(h.d)}</span></div></li>`).join('')}</ol>
      </div>
    </section>
    ${S.explain ? `<section style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:18px">
        <h2 class="h2">${esc(S.kicker)} explained</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">${S.explain.map((e) => `<div style="padding:16px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:6px"><h3 style="font-size:15px">${esc(e.t)}</h3><p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.5">${esc(e.d)}</p></div>`).join('')}</div>
      </section>` : ''}
    ${S.sections.length ? `<section style="padding:var(--sec-pad-y);display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:12px">
        ${S.sections.map((x) => `<div class="card" style="padding:18px;gap:10px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px ${x.c},0 0 18px ${x.glow}">${ic(x.i, `font-size:32px;color:${x.c};filter:drop-shadow(0 0 6px ${x.c})`)}<h2 style="font-size:18px">${esc(x.t)}</h2><p class="card-body" style="margin:0;font-size:14px">${esc(x.d)}</p>
            <ul class="ul" style="display:flex;flex-direction:column;gap:5px">${x.items.map((t) => `<li style="display:flex;gap:8px;font-size:14px;color:var(--color-neutral-200)">${ic('dot-outline', 'color:var(--color-accent)')}${esc(t)}</li>`).join('')}</ul>
            ${x.link ? `<a href="${u(FILE.checklists)}#address" style="font-size:13px">Open the full checklist →</a>` : ''}
          </div>`).join('\n        ')}
      </section>` : ''}
    <section style="padding:var(--sec-pad-y);display:flex;flex-wrap:wrap;gap:32px">
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:12px">
        <h2 class="h2">What happens after you enquire?</h2>
        <ol class="ul" style="display:flex;flex-direction:column;gap:10px">${U.after.map((t, i) => `<li style="display:flex;gap:12px;font-size:15px"><span style="color:var(--color-accent-300);width:18px">${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
      </div>
      <div style="flex:1.4 1 380px;display:flex;flex-direction:column;gap:6px">
        <h2 class="h2" style="margin-bottom:6px">Questions</h2>
        ${S.faqs.map((f) => faqRow(f, f.g ? `<a href="${u(gFile(f.g))}" style="font-size:13px">Read the full answer →</a>` : '')).join('\n        ')}
      </div>
    </section>
    ${S.warning ? `<p style="margin:0 0 24px;padding:14px 16px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--color-divider);font-size:13px;line-height:1.55;color:var(--color-neutral-300)">${ic('info', 'color:var(--color-accent)')} ${esc(S.warning)}</p>` : ''}
  </div>`;
}

/* ── Specialist transactions ────────────────────────────────────────────── */

function specialistBody() {
  return `<section style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
    <span class="kicker">Specialist property transactions</span>
    <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em;text-wrap:balance">My transaction isn’t straightforward</h1>
    <p style="margin:0;font-size:17px;color:var(--color-neutral-300);max-width:620px;line-height:1.6;text-wrap:pretty">Find the situation closest to yours. If it isn’t here, or you have more than one, tell us and we’ll work out the route with you.</p>
    <div><button type="button" data-lead="move" class="btn btn-primary" style="height:44px">Tell us about my move${ic('arrow-right')}</button></div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:34px">
    ${specGroups().map((g) => `<section style="display:flex;flex-direction:column;gap:12px">
        <h2 style="font-size:22px;letter-spacing:-0.02em;display:flex;gap:10px;align-items:center">${ic(g.i, `color:${g.c};filter:drop-shadow(0 0 5px ${g.c})`)}${esc(g.g)}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">
          ${g.items.map((it) => `<a ${linkAttrs(it.to)} class="lk hv-ring" style="padding:16px;border-radius:12px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1px ${it.dim};display:flex;flex-direction:column;gap:6px;transition:box-shadow .15s"><span style="font-size:15px;font-weight:500;color:${it.c}">${esc(it.t)}</span><span style="font-size:13px;color:var(--color-neutral-400);line-height:1.45">${esc(it.d)}</span></a>`).join('\n          ')}
        </div>
      </section>`).join('\n    ')}
  </div>`;
}

/* ── Property Hub ───────────────────────────────────────────────────────── */

function hubBody(catId) {
  const exQs = ['What happens after my offer is accepted?', 'How long does conveyancing take?', 'Do I need a survey?', 'When should I book removals?'];
  return `<section style="background:${bg(NEON[0], NEON[2])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <span class="kicker">The Properfy Property Hub</span>
      <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em">Have a property question?</h1>
      <p style="margin:0;font-size:17px;color:var(--color-neutral-300);max-width:600px;line-height:1.6">Straight answers to the questions people ask when they buy, sell and move, with what to do next.</p>
      <form role="search" data-hub-search style="position:relative;max-width:640px" action="${u(FILE.hub)}" method="get">${ic('magnifying-glass', 'position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);font-size:18px')}<input class="input" name="q" data-hub-q placeholder="What would you like to know?" style="padding-left:42px;height:50px;font-size:16px;width:100%;box-sizing:border-box" aria-label="Search property questions" autocomplete="off"></form>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${exQs.map((x) => `<button type="button" data-example class="tag tag-outline" style="cursor:pointer;background:none;font:inherit;font-size:11px">${esc(x)}</button>`).join('')}</div>
    </div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:34px">
    <section data-hub-results hidden aria-live="polite" style="display:flex;flex-direction:column;gap:4px"></section>
    <section style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;flex-wrap:wrap;gap:6px" role="group" aria-label="Topics">${P.cats.map((c, i) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${c.id === catId}">${ic(c.icon, `color:${NEON[i % 6]}`)}${esc(c.label)}</button>`).join('')}</div>
      ${P.cats.map((c) => {
        const col = NEON[P.cats.indexOf(c) % 6];
        return `<div data-cat-panel="${c.id}"${c.id === catId ? '' : ' hidden'} style="display:flex;flex-direction:column;gap:16px">
        <h2 class="h2">${c.id === 'ftb' ? 'First-time buyer hub' : esc(c.label) + ' questions'}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:10px">
          ${c.guides.map((id) => { const g = P.guides[id]; return `<a href="${u(gFile(id))}" class="lk hv-800" style="padding:18px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:8px">
            <span style="width:28px;height:3px;border-radius:2px;background:${col};box-shadow:0 0 10px ${col}"></span>
            <h3 style="font-size:17px;line-height:1.3">${esc(g.title)}</h3>
            <p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.5">${esc(short(id))}</p>
            <span style="margin-top:auto;font-size:12px;color:var(--color-neutral-500)">Answers ${g.qs.length} questions · ${g.mins} min read</span>
          </a>`; }).join('\n          ')}
        </div>
      </div>`;
      }).join('\n      ')}
    </section>
    <section style="display:flex;flex-direction:column;gap:14px">
      <h2 class="h2">Properfy Explains</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));gap:10px">${explainsList().map((e) => `<a href="${u(e.href)}" class="lk hv-ring7" style="padding:16px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--color-divider);display:flex;flex-direction:column;gap:6px"><span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${e.c}">Properfy Explains</span><span style="font-size:15px;font-weight:500">${esc(e.title)}</span></a>`).join('')}</div>
    </section>
    <section style="display:flex;flex-wrap:wrap;gap:12px">
      <a href="${u(FILE.checklists)}" class="card elev-sm lk hv-card" style="flex:1 1 300px;padding:18px;gap:8px">${ic('list-checks', 'font-size:24px;color:var(--color-accent)')}<span class="card-title">Checklists</span><span class="card-body" style="font-size:14px">Buying, selling, exchange, completion, moving and change of address.</span></a>
      <a href="${u(FILE.glossary)}" class="card elev-sm lk hv-card" style="flex:1 1 300px;padding:18px;gap:8px">${ic('book-open-text', 'font-size:24px;color:var(--color-accent)')}<span class="card-title">Property glossary</span><span class="card-body" style="font-size:14px">Every term, from disbursements to gazundering, in one sentence.</span></a>
    </section>
  </div>`;
}

/* ── Guides ─────────────────────────────────────────────────────────────── */

function articleBody(id) {
  const g = P.guides[id];
  const c = cat(g.cat);
  const col = NEON[P.cats.indexOf(c) % 6];
  const glow = col + '40';
  const related = c.guides.filter((x) => x !== id).concat(g.follow ? g.follow.map((f) => f.g).filter(Boolean) : [])
    .filter((x, i, a) => a.indexOf(x) === i && x !== id).slice(0, 6);
  const meta = [CFG.reviewer ? `<span>${ic('seal-check', 'color:var(--color-accent)')} Reviewed by ${esc(CFG.reviewer)}</span>` : '', `<span>Updated ${esc(CFG.guidesUpdated)}</span>`, '<span>England &amp; Wales</span>', `<span>${g.mins} min read</span>`].join('');
  return `<div style="max-width:1180px;margin:0 auto;padding:var(--article-pad);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start">
    <article style="flex:1 1 560px;min-width:0;max-width:760px;display:flex;flex-direction:column;gap:26px">
      <header style="display:flex;flex-direction:column;gap:12px">
        <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${col}">${esc(c.label)}</span>
        <h1 style="font-size:var(--h1-art);line-height:1.08;letter-spacing:-0.03em;text-wrap:balance">${esc(g.title)}</h1>
        <div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--color-neutral-400)">${meta}</div>
      <div style="height:1px;background:${RAINBOW};opacity:.85"></div></header>
      <section style="padding:18px 20px;border-radius:8px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px ${col},0 0 20px ${glow};display:flex;flex-direction:column;gap:8px">
        <h2 style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-300)">The short answer</h2>
        <p style="margin:0;font-size:18px;line-height:1.55;text-wrap:pretty">${esc(g.answer)}</p>
      </section>
      ${g.why ? `<section style="display:flex;flex-direction:column;gap:8px"><h2 style="font-size:24px;letter-spacing:-0.02em">Why?</h2><p style="margin:0;font-size:16px;line-height:1.65;color:var(--color-neutral-200);text-wrap:pretty">${esc(g.why)}</p></section>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:20px">
          <section style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:20px;letter-spacing:-0.02em">What can cause problems?</h2><ul class="ul" style="display:flex;flex-direction:column;gap:8px">${(g.problems || []).map((t) => `<li style="display:flex;gap:10px;font-size:15px;line-height:1.45">${ic('warning', 'color:var(--color-accent-300);margin-top:3px')}${esc(t)}</li>`).join('')}</ul></section>
          <section style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:20px;letter-spacing:-0.02em">What should you do?</h2><ul class="ul" style="display:flex;flex-direction:column;gap:8px">${(g.todo || []).map((t) => `<li style="display:flex;gap:10px;font-size:15px;line-height:1.45">${ic('check', 'color:var(--color-accent);margin-top:3px')}${esc(t)}</li>`).join('')}</ul></section>
        </div>
        <section style="padding:18px 20px;border-radius:8px;background:var(--color-accent-900);box-shadow:inset 0 0 0 1px var(--color-accent-700);display:flex;flex-direction:column;gap:12px">
          <h2 style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent-200)">What happens next?</h2>
          <ol class="ul" style="display:flex;flex-direction:column;gap:10px">${num(g.next || []).map((x) => `<li style="display:flex;gap:12px;font-size:15px"><span style="color:var(--color-accent-300);width:18px;font-variant-numeric:tabular-nums">${x.n}</span>${esc(x.t)}</li>`).join('')}</ol>
        </section>` : ''}
      <section style="display:flex;flex-direction:column;gap:12px">
        <h2 style="font-size:24px;letter-spacing:-0.02em">How can Properfy help?</h2>
        <p style="margin:0;font-size:15px;color:var(--color-neutral-300);line-height:1.6">Not sure what you need? Tell us about your move and we’ll help you work out the next step.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${svcChips(g.help)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-lead="move" class="btn btn-primary" style="height:42px">Tell us about my move${ic('arrow-right')}</button><button type="button" data-lead="callback" class="btn btn-secondary" style="height:42px">${ic('phone')}Request a callback</button></div>
      </section>
      ${g.follow ? `<section style="display:flex;flex-direction:column;gap:4px">
          <h2 style="font-size:24px;letter-spacing:-0.02em;margin-bottom:8px">You might also be wondering</h2>
          ${g.follow.map((f) => `<div style="padding:14px 0;display:flex;flex-direction:column;gap:5px;background:${FADE}"><h3 style="font-size:17px">${esc(f.q)}</h3><p style="margin:0;font-size:15px;color:var(--color-neutral-300);line-height:1.55">${esc(f.a)}</p>${f.g ? `<a href="${u(gFile(f.g))}" style="font-size:13px">Read more →</a>` : ''}</div>`).join('')}
        </section>` : ''}
      <section style="display:flex;flex-direction:column;gap:10px">
        <h2 style="font-size:16px;color:var(--color-neutral-300)">Questions this guide answers</h2>
        <ul class="ul" style="display:flex;flex-wrap:wrap;gap:6px">${g.qs.map((q) => `<li class="tag tag-neutral">${esc(q)}</li>`).join('')}</ul>
      </section>
    </article>
    <aside style="flex:1 1 260px;min-width:0;max-width:340px;position:var(--aside-pos);top:84px;display:flex;flex-direction:column;gap:16px">
      <div style="padding:18px;border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px">
        <span style="font-size:16px;font-weight:500">Talk it through with us</span>
        <span style="font-size:13px;color:var(--color-neutral-400);line-height:1.5">Every move is different. Tell us yours and we’ll explain your next steps.</span>
        <button type="button" data-lead="move" class="btn btn-primary btn-block" style="height:40px">Tell us about my move</button>
      </div>
      <nav aria-label="Related guides" style="display:flex;flex-direction:column">
        <span style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-400);margin-bottom:4px">Related guides</span>
        ${related.map((r) => `<a href="${u(gFile(r))}" class="lk hv-text" style="padding:10px 0;font-size:14px;background:${FADE}">${esc(P.guides[r].title)}</a>`).join('')}
      </nav>
    </aside>
  </div>`;
}

/* ── Checklists, glossary, about ────────────────────────────────────────── */

function checklistsBody() {
  return `<section style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
    <span class="kicker">Properfy checklists</span>
    <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em">Checklists for every stage</h1>
    <p style="margin:0;font-size:17px;color:var(--color-neutral-300);max-width:600px;line-height:1.6">Tick things off as you go. Your progress is saved in this browser.</p>
  </section>
  <div data-checklists style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start">
    <nav class="no-print" aria-label="Checklists" style="flex:1 1 220px;max-width:280px;display:flex;flex-direction:column;gap:2px">
      ${P.checklists.map((c, i) => `<button type="button" class="lk hv-surface" data-cl-tab="${c.id}" aria-pressed="${i === 0}" style="padding:9px 12px;border-radius:8px;font-size:14px;display:flex;justify-content:space-between;gap:10px;${i === 0 ? 'background:var(--color-surface);color:var(--color-text)' : 'background:transparent;color:var(--color-neutral-300)'}">${esc(c.title)}<span data-cl-prog style="font-size:12px;color:var(--color-neutral-500)"></span></button>`).join('\n      ')}
    </nav>
    <section style="flex:3 1 420px;min-width:0;display:flex;flex-direction:column;gap:14px">
      ${P.checklists.map((c, i) => `<div class="print-area" data-cl-panel="${c.id}"${i === 0 ? '' : ' hidden'} style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between"><h2 style="font-size:26px;letter-spacing:-0.02em">${esc(c.title)}</h2><span data-cl-label style="font-size:13px;color:var(--color-neutral-400)">0 of ${c.items.length} done</span></div>
        <div style="height:3px;border-radius:2px;background:var(--color-neutral-800);position:relative"><div data-cl-bar style="position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--color-accent);box-shadow:0 0 10px var(--color-accent);transition:width .3s;width:0%"></div></div>
        <ul class="ul" style="display:flex;flex-direction:column">
          ${c.items.map((t, j) => `<li><button type="button" class="lk" role="checkbox" aria-checked="false" data-cl-item="${c.id}:${j}" style="width:100%;display:flex;gap:12px;align-items:center;padding:12px 4px;font-size:15px;background:${FADE};color:var(--color-text)"><span data-box style="flex:none;width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px var(--color-neutral-600);background:transparent">${ic('check', 'font-size:13px;color:var(--color-accent-100);visibility:hidden')}</span><span data-text>${esc(t)}</span></button></li>`).join('\n          ')}
        </ul>
      </div>`).join('\n      ')}
      <div class="no-print" style="margin-top:6px;padding:16px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:10px">
        <form data-form="checklist" novalidate style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <span style="flex:1 1 220px;font-size:14px">Email me this checklist</span>
          <input class="input" name="email" placeholder="you@example.com" type="email" autocomplete="email" aria-label="Your email" style="flex:1 1 200px">
          <input class="input" name="postcode" placeholder="Postcode" autocomplete="postal-code" autocapitalize="characters" aria-label="Your postcode" style="flex:0 1 130px">
          ${honeypot()}
          <button type="submit" class="btn btn-primary">Send</button>
          <button type="button" class="btn btn-ghost" data-print>${ic('printer')}Print</button>
        </form>
        ${err()}
        <span data-sent hidden role="status" style="font-size:14px">${ic('ph-fill ph-check-circle', 'color:var(--color-accent)')} Sent. Check your inbox.</span>
      </div>
    </section>
  </div>`;
}

function glossaryBody() {
  return `<section style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
    <span class="kicker">Property glossary</span>
    <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em">Property terms, in plain English</h1>
    <input class="input" data-gl-q placeholder="Find a term" style="max-width:420px;height:44px" aria-label="Filter glossary" autocomplete="off">
  </section>
  <dl style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:0 32px">
    ${P.glossary.map((g) => `<div data-term="${esc((g.t + ' ' + g.d).toLowerCase())}" style="padding:14px 0;display:flex;flex-direction:column;gap:4px;background:${FADE}"><dt style="font-size:16px;font-weight:500">${esc(g.t)}</dt><dd style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.5">${esc(g.d)}</dd>${g.g ? `<a href="${u(gFile(g.g))}" style="font-size:13px">Read the guide →</a>` : ''}</div>`).join('\n    ')}
  </dl>
  <p data-gl-none hidden style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;font-size:14px;color:var(--color-neutral-400)">No terms match that yet.</p>`;
}

function aboutBody() {
  return `<section style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
    <span class="kicker">About Properfy</span>
    <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em;max-width:820px;text-wrap:balance">A property concierge for the whole of your move</h1>
    <p style="margin:0;font-size:17px;color:var(--color-neutral-300);max-width:640px;line-height:1.6;text-wrap:pretty">Properfy helps people understand what they need to do next when they buy, sell or move home, and connects them with professionals who can help.</p>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:28px 40px">
    ${U.about.map((b) => `<section style="display:flex;flex-direction:column;gap:10px;padding-top:14px;background:linear-gradient(to right,var(--color-accent),transparent 60%) no-repeat top/100% 1px">
        <h2 style="font-size:20px;letter-spacing:-0.02em">${esc(b.t)}</h2>
        <p style="margin:0;font-size:15px;color:var(--color-neutral-300);line-height:1.6;text-wrap:pretty">${esc(b.d)}</p>
        ${b.items ? `<ul class="ul" style="display:flex;flex-direction:column;gap:6px">${b.items.map((t) => `<li style="display:flex;gap:8px;font-size:14px;color:var(--color-neutral-200)">${ic('check', 'color:var(--color-accent);margin-top:3px')}${esc(t)}</li>`).join('')}</ul>` : ''}
      </section>`).join('\n    ')}
  </div>`;
}

/* ── Sell fast ──────────────────────────────────────────────────────────── */

const nchips = (name, list, c, label) => `<div style="display:flex;flex-wrap:wrap;gap:6px" role="group" aria-label="${esc(label || name)}" data-chips="${name}">${list.map((x) => `<button type="button" class="nchip chip-m" style="--c:${c}" data-value="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div>`;

function quickBody() {
  const Q = P.quick;
  const O = NEON[4];
  const routeCol = [NEON[4], NEON[3], NEON[2]];
  const btnO = 'color:var(--color-text);box-shadow:inset 0 0 0 1.5px #ff7a2f,0 0 16px rgba(255,122,47,.35);border:none';
  const ticks = ['No obligation', 'Straight talk about price', 'You choose the completion date', 'Your own independent solicitor'];
  return `<section style="background:${bg(NEON[4], NEON[5])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start">
      <div style="flex:1 1 400px;min-width:0;display:flex;flex-direction:column;gap:16px">
        <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#ff7a2f;display:flex;gap:8px;align-items:center">${ic('lightning', 'font-size:16px;filter:drop-shadow(0 0 5px #ff7a2f)')}Quick sale</span>
        <h1 style="font-size:var(--h1);line-height:1.03;letter-spacing:-0.035em;text-wrap:balance">Sell your house fast</h1>
        <p style="margin:0;font-size:17px;line-height:1.6;color:var(--color-neutral-300);max-width:560px;text-wrap:pretty">Need to sell quickly? Tell us about your property and we’ll set out your options, including offers from cash buyers, so you can choose the right route with your eyes open.</p>
        <ul class="ul" style="display:flex;flex-wrap:wrap;gap:8px 18px">${ticks.map((t) => `<li style="display:flex;gap:7px;align-items:center;font-size:14px;color:var(--color-neutral-200)">${ic('check', 'color:#ff7a2f')}${t}</li>`).join('')}</ul>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px"><span id="qs-reason-label" style="font-size:13px;color:var(--color-neutral-400)">Why do you need to sell quickly?</span>${nchips('reason', Q.reasons, O, 'Why do you need to sell quickly?').replace('role="group"', 'role="group" data-toggle')}</div>
      </div>
      <div id="qs-form" style="flex:1 1 360px;min-width:0;max-width:460px;padding:22px;border-radius:14px;background:rgba(8,10,34,0.88);box-shadow:inset 0 0 0 1.5px #ff7a2f,0 0 30px rgba(255,122,47,.28);display:flex;flex-direction:column;gap:14px;scroll-margin-top:90px">
        <form data-form="quick" novalidate style="display:flex;flex-direction:column;gap:14px">
          <div data-step="0" style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;flex-direction:column;gap:4px"><h2 style="font-size:20px;font-weight:500;line-height:1.55;letter-spacing:0">Get your quick-sale options</h2><span style="font-size:13px;color:var(--color-neutral-400)">Step 1 of 2 · About the property</span></div>
            <div style="display:flex;gap:5px"><div style="flex:1;height:3px;border-radius:2px;background:#ff7a2f;box-shadow:0 0 8px #ff7a2f"></div><div style="flex:1;height:3px;border-radius:2px;background:var(--color-neutral-800)"></div></div>
            ${field('Property postcode', '<input class="input" name="postcode" placeholder="e.g. E8 3PL" autocomplete="postal-code" autocapitalize="characters">')}
            <div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">Property type</span>${nchips('type', Q.types, O, 'Property type')}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${field('Rough value', select('value', Q.values))}
              ${field('Mortgage', select('mortgage', Q.mortgage))}
            </div>
            <div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">How quickly do you need to sell?</span>${nchips('time', Q.times, O, 'How quickly do you need to sell?')}</div>
            ${err('data-err="0"', '#ffb48a')}
            <button type="button" data-next class="btn btn-block hv-orange" style="height:46px;font-size:15px;${btnO}">Continue${ic('arrow-right')}</button>
          </div>
          <div data-step="1" hidden style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;flex-direction:column;gap:4px"><h2 style="font-size:20px;font-weight:500;line-height:1.55;letter-spacing:0">Where can we reach you?</h2><span style="font-size:13px;color:var(--color-neutral-400)">Step 2 of 2 · We’ll call to talk through your options</span></div>
            <div style="display:flex;gap:5px"><div style="flex:1;height:3px;border-radius:2px;background:#ff7a2f"></div><div style="flex:1;height:3px;border-radius:2px;background:#ff7a2f;box-shadow:0 0 8px #ff7a2f"></div></div>
            ${field('Name', '<input class="input" name="name" placeholder="Your name" autocomplete="name">')}
            ${field('Phone', '<input class="input" name="phone" placeholder="07…" type="tel" autocomplete="tel">')}
            ${field('Email (optional)', '<input class="input" name="email" placeholder="you@example.com" type="email" autocomplete="email">')}
            ${honeypot()}
            ${err('data-err="1"', '#ffb48a')}
            <div style="display:flex;gap:8px"><button type="button" data-back class="btn btn-ghost">Back</button><button type="submit" class="btn hv-orange" style="flex:1;height:46px;font-size:15px;${btnO}">Get my options${ic('arrow-right')}</button></div>
            <span style="font-size:11px;color:var(--color-neutral-500);line-height:1.5">No obligation. We’ll only share your details with a buyer or agent once you’ve agreed.</span>
          </div>
        </form>
        <div data-sent hidden role="status" style="display:flex;flex-direction:column;gap:14px">
          ${ic('ph-fill ph-check-circle', 'font-size:32px;color:#ff7a2f;filter:drop-shadow(0 0 8px #ff7a2f)')}
          <span style="font-size:20px;font-weight:500">Thanks <span data-first></span>, we’re on it.</span>
          <span style="font-size:14px;color:var(--color-neutral-300);line-height:1.55">We’ll call you shortly to talk through your options: cash buyers, auction or a fast-track agent sale. Nothing happens without your say-so.</span>
          <span style="font-size:13px;color:var(--color-neutral-400)">Your reference: <span data-ref></span></span>
        </div>
      </div>
    </div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x);box-sizing:border-box;width:100%;display:flex;flex-direction:column">
    <section style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;flex-direction:column;gap:6px;max-width:640px"><h2 class="h2">Three ways to sell fast</h2><p style="margin:0;font-size:15px;color:var(--color-neutral-400)">Speed, price and certainty trade off against each other. Here’s how the options compare.</p></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px">
        ${Q.routes.map((r, i) => { const c = routeCol[i]; return `<div style="padding:20px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px ${c},0 0 18px ${c}40;display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3 style="font-size:19px;color:${c}">${esc(r.t)}</h3>${ic(r.icon, `font-size:26px;color:${c};filter:drop-shadow(0 0 5px ${c})`)}</div>
            <dl style="margin:0;display:flex;flex-direction:column;gap:12px">${r.rows.map((row) => `<div style="display:flex;flex-direction:column;gap:2px"><dt style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-400)">${esc(row.k)}</dt><dd style="margin:0;font-size:15px;line-height:1.4">${esc(row.v)}</dd></div>`).join('')}</dl>
          </div>`; }).join('\n        ')}
      </div>
      <span style="font-size:12px;color:var(--color-neutral-500)">Typical ranges, not promises. Every property and buyer is different.</span>
    </section>
    <section style="padding:var(--sec-pad-y);display:flex;flex-wrap:wrap;gap:32px">
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:14px">
        <h2 class="h2">How it works</h2>
        <ol class="ul" style="display:flex;flex-direction:column;gap:12px">${Q.how.map((t, i) => `<li style="display:flex;gap:14px;align-items:center;font-size:15px"><span style="flex:none;width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #ff7a2f,0 0 10px rgba(255,122,47,.4);display:flex;align-items:center;justify-content:center;font-size:12px;color:#ff7a2f">${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
      </div>
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:16px">
        <div style="padding:18px;border-radius:14px;box-shadow:inset 0 0 0 1.5px #1fd67a,0 0 16px rgba(31,214,122,.2);display:flex;flex-direction:column;gap:10px"><h3 style="font-size:17px;color:#1fd67a">What a good cash buyer looks like</h3><ul class="ul" style="display:flex;flex-direction:column;gap:7px">${Q.checks.map((t) => `<li style="display:flex;gap:8px;font-size:14px;line-height:1.45">${ic('check-circle', 'color:#1fd67a;margin-top:2px')}${esc(t)}</li>`).join('')}</ul></div>
        <div style="padding:18px;border-radius:14px;box-shadow:inset 0 0 0 1.5px #ff2e9a,0 0 16px rgba(255,46,154,.2);display:flex;flex-direction:column;gap:10px"><h3 style="font-size:17px;color:#ff2e9a">Red flags to walk away from</h3><ul class="ul" style="display:flex;flex-direction:column;gap:7px">${Q.flags.map((t) => `<li style="display:flex;gap:8px;font-size:14px;line-height:1.45">${ic('x-circle', 'color:#ff2e9a;margin-top:2px')}${esc(t)}</li>`).join('')}</ul></div>
      </div>
    </section>
    <section style="padding:var(--sec-pad-y);display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start">
      <div style="flex:1.4 1 380px;display:flex;flex-direction:column"><h2 class="h2" style="margin-bottom:8px">Quick sale questions</h2>${Q.faqs.map((f) => `<div style="padding:14px 0;display:flex;flex-direction:column;gap:5px;background:${FADE}"><h3 style="font-size:16px">${esc(f.q)}</h3><p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.55">${esc(f.a)}</p>${f.g ? `<a href="${u(FILE.repo)}" style="font-size:13px;color:#29b6f6">Repossession help →</a>` : ''}</div>`).join('')}</div>
      <div style="flex:1 1 280px;display:flex;flex-direction:column;gap:12px">
        <a href="#qs-form" class="lk" style="padding:20px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px #ff7a2f,0 0 18px rgba(255,122,47,.25);display:flex;flex-direction:column;gap:8px"><span style="font-size:17px;font-weight:500">Ready to see your options?</span><span style="font-size:14px;color:var(--color-neutral-300)">Two minutes, no obligation.</span><span style="font-size:14px;color:#ff7a2f;display:flex;gap:6px;align-items:center">Get my quick-sale options${ic('arrow-up')}</span></a>
        <a href="${u(FILE.repo)}" class="lk" style="padding:20px;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(41,182,246,.5);display:flex;flex-direction:column;gap:6px"><span style="font-size:15px;font-weight:500;color:#29b6f6">Behind on your mortgage?</span><span style="font-size:14px;color:var(--color-neutral-300)">See your options if you’re worried about repossession.</span></a>
      </div>
    </section>
  </div>`;
}

/* ── Repossession help ──────────────────────────────────────────────────── */

function repoBody() {
  const RP = P.repo;
  const C = NEON[0];
  const stg = RP.stages[0];
  const uc = NEON[1];
  const btnB = 'color:var(--color-text);border:none;box-shadow:inset 0 0 0 1.5px #29b6f6,0 0 16px rgba(41,182,246,.35)';
  const ticks = ['Confidential', 'No judgement', 'No charge for our call', 'Signposts to free advice'];
  const optCols = [1, 0, 2, 5, 3, 4].map((i) => NEON[i]);
  return `<section style="background:${bg(NEON[0], NEON[1])}">
    <div style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#29b6f6;display:flex;gap:8px;align-items:center">${ic('lifebuoy', 'font-size:16px;filter:drop-shadow(0 0 5px #29b6f6)')}Repossession help</span>
      <h1 style="font-size:var(--h1);line-height:1.03;letter-spacing:-0.035em;max-width:820px;text-wrap:balance">Worried about losing your home?</h1>
      <p style="margin:0;font-size:17px;line-height:1.6;color:var(--color-neutral-300);max-width:620px;text-wrap:pretty">If you’re behind on your mortgage or have had a letter from your lender, you’re not on your own, and you may have more options than you think. The sooner you act, the more of them you have.</p>
      <ul class="ul" style="display:flex;flex-wrap:wrap;gap:8px 18px">${ticks.map((t) => `<li style="display:flex;gap:7px;align-items:center;font-size:14px;color:var(--color-neutral-200)">${ic('check', 'color:#29b6f6')}${t}</li>`).join('')}</ul>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
        <a href="#rp-form" class="btn hv-blue" style="height:46px;padding:0 20px;font-size:15px;${btnB}">${ic('phone')}Request a confidential callback</a>
        <a href="#rp-advice" class="btn btn-secondary" style="height:46px;padding:0 20px;font-size:15px">Free independent advice</a>
      </div>
    </div>
  </section>
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x);box-sizing:border-box;width:100%;display:flex;flex-direction:column">
    <section data-repo style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;flex-direction:column;gap:6px"><h2 class="h2">Where are you now?</h2><span style="font-size:14px;color:var(--color-neutral-400)">Pick the one closest to your situation. This covers England and Wales.</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px" role="group" aria-label="Where are you now?">${RP.stages.map((x, i) => `<button type="button" class="nchip chip-l" style="--c:${C}" data-stage="${x.id}" aria-pressed="${i === 0}">${esc(x.label)}</button>`).join('')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">
        <div data-stage-panel aria-live="polite" style="flex:1.2 1 380px;min-width:0;padding:22px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1px rgba(41,182,246,.35);display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><h3 data-stage-label style="font-size:22px;letter-spacing:-0.02em">${esc(stg.label)}</h3><span data-stage-urgency style="padding:4px 10px;border-radius:12px;font-size:12px;color:var(--color-text);background:${uc}22;box-shadow:inset 0 0 0 1px ${uc}">${esc(stg.urgency)}</span></div>
          <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-400)">What this means</span><p data-stage-what style="margin:0;font-size:15px;line-height:1.55">${esc(stg.what)}</p></div>
          <div style="display:flex;flex-direction:column;gap:10px"><span style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#29b6f6">What to do now</span><ol data-stage-now class="ul" style="display:flex;flex-direction:column;gap:10px">${stg.now.map((t, i) => `<li style="display:flex;gap:12px;font-size:15px;line-height:1.45"><span style="flex:none;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #29b6f6;display:flex;align-items:center;justify-content:center;font-size:11px;color:#29b6f6">${i + 1}</span>${esc(t)}</li>`).join('')}</ol></div>
        </div>
        <div id="rp-form" style="flex:1 1 340px;min-width:0;max-width:460px;padding:22px;border-radius:14px;background:rgba(8,10,34,0.88);box-shadow:inset 0 0 0 1.5px #29b6f6,0 0 30px rgba(41,182,246,.25);display:flex;flex-direction:column;gap:14px;scroll-margin-top:90px">
          <form data-form="repo" novalidate style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;flex-direction:column;gap:4px"><h2 style="font-size:20px;font-weight:500;line-height:1.55;letter-spacing:0">Request a confidential callback</h2><span style="font-size:13px;color:var(--color-neutral-400)">Your situation: <span data-stage-name>${esc(stg.label)}</span></span></div>
            ${field('How far behind are you?', select('behind', RP.behind))}
            <div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">What would you like to happen?</span>${nchips('want', RP.wants, C, 'What would you like to happen?')}</div>
            ${field('Name', '<input class="input" name="name" placeholder="Your name" autocomplete="name">')}
            ${field('Phone', '<input class="input" name="phone" placeholder="07…" type="tel" autocomplete="tel">')}
            ${field('Postcode', '<input class="input" name="postcode" placeholder="e.g. E8 3PL" autocomplete="postal-code" autocapitalize="characters">')}
            <div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">Best time to call</span>${nchips('time', ['As soon as possible', 'Morning', 'Afternoon', 'Evening'], C, 'Best time to call')}</div>
            <div style="display:flex;gap:12px;align-items:center"><button type="button" role="switch" aria-checked="true" data-vm aria-labelledby="vm-label" style="width:44px;height:26px;border-radius:13px;position:relative;cursor:pointer;flex:none;transition:background .2s;background:${C};border:0;padding:0"><span style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:var(--color-neutral-100);transition:left .2s;left:21px"></span></button><span id="vm-label" style="font-size:14px">It’s OK to leave a voicemail</span></div>
            ${honeypot()}
            ${err('', '#8fd8ff')}
            <button type="submit" class="btn btn-block hv-blue" style="height:46px;font-size:15px;${btnB}">Request my callback</button>
            <span style="font-size:11px;color:var(--color-neutral-500);line-height:1.5">What you tell us stays confidential. We’ll only share it with a partner if you agree.</span>
          </form>
          <div data-sent hidden role="status" style="display:flex;flex-direction:column;gap:14px">
            ${ic('ph-fill ph-check-circle', 'font-size:32px;color:#29b6f6;filter:drop-shadow(0 0 8px #29b6f6)')}
            <span style="font-size:20px;font-weight:500">Thanks <span data-first></span>. We’ll call you <span data-when></span>.</span>
            <span style="font-size:14px;color:var(--color-neutral-300);line-height:1.55">We’ll listen first, then help you work out your options.</span>
            <span data-urgent hidden style="padding:12px;border-radius:8px;background:rgba(255,122,47,.12);box-shadow:inset 0 0 0 1px #ff7a2f;font-size:14px;line-height:1.5">Because you have a court or eviction date, please also contact a free advice service today. Don’t wait for our call.</span>
            <span style="font-size:13px;color:var(--color-neutral-400)">Your reference: <span data-ref></span></span>
          </div>
        </div>
      </div>
    </section>
    <section style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:18px">
      <h2 class="h2">Options you may have</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:10px">${RP.options.map((o, i) => { const c = optCols[i]; return `<div style="padding:18px;border-radius:14px;background:rgba(8,10,34,0.6);box-shadow:inset 0 0 0 1.5px ${c},0 0 14px ${c}33;display:flex;flex-direction:column;gap:8px">${ic(o.i, `font-size:26px;color:${c};filter:drop-shadow(0 0 5px ${c})`)}<h3 style="font-size:16px">${esc(o.t)}</h3><p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.5">${esc(o.d)}</p></div>`; }).join('')}</div>
    </section>
    <section id="rp-advice" style="padding:var(--sec-pad-y);display:flex;flex-direction:column;gap:14px;scroll-margin-top:90px">
      <h2 class="h2">Free, independent advice</h2>
      <p style="margin:0;font-size:15px;color:var(--color-neutral-300);max-width:640px;line-height:1.55">These organisations give free advice on mortgage arrears and repossession. They’re independent of Properfy, and we’d always encourage you to speak to one.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));gap:10px">${RP.advice.map((a) => `<div style="padding:16px;border-radius:8px;background:var(--color-surface);display:flex;flex-direction:column;gap:4px"><span style="font-size:16px;font-weight:500;color:#1fd67a">${esc(a.t)}</span><span style="font-size:14px;color:var(--color-neutral-300)">${esc(a.d)}</span></div>`).join('')}</div>
    </section>
    <section style="padding:var(--sec-pad-y);display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start">
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:12px">
        <h2 class="h2">How Properfy can help</h2>
        <ul class="ul" style="display:flex;flex-direction:column;gap:8px">${RP.help.map((t) => `<li style="display:flex;gap:10px;font-size:15px;line-height:1.45">${ic('check', 'color:#29b6f6;margin-top:3px')}${esc(t)}</li>`).join('')}</ul>
        <p style="margin:6px 0 0;padding:14px 16px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--color-divider);font-size:13px;line-height:1.55;color:var(--color-neutral-300)">${ic('info', 'color:#29b6f6')} Properfy is not a debt advice service or a law firm, and we can’t stop a repossession. We help you understand your options and connect you with regulated professionals and free advice services.</p>
      </div>
      <div style="flex:1.3 1 380px;display:flex;flex-direction:column"><h2 class="h2" style="margin-bottom:8px">Common questions</h2>${RP.faqs.map((f) => `<div style="padding:14px 0;display:flex;flex-direction:column;gap:5px;background:${FADE}"><h3 style="font-size:16px">${esc(f.q)}</h3><p style="margin:0;font-size:14px;color:var(--color-neutral-300);line-height:1.55">${esc(f.a)}</p></div>`).join('')}</div>
    </section>
  </div>`;
}

/* ── Supporting pages ───────────────────────────────────────────────────── */

const simpleHero = (kicker, h1, p) => `<section style="max-width:1180px;margin:0 auto;padding:var(--page-hero-pad);box-sizing:border-box;display:flex;flex-direction:column;gap:14px">
    <span class="kicker">${kicker}</span>
    <h1 style="font-size:var(--h1);line-height:1.05;letter-spacing:-0.035em;max-width:820px;text-wrap:balance">${h1}</h1>
    ${p ? `<p style="margin:0;font-size:17px;color:var(--color-neutral-300);max-width:640px;line-height:1.6;text-wrap:pretty">${p}</p>` : ''}
  </section>`;

function privacyBody() {
  const c = CFG.contact;
  return simpleHero('Privacy notice', 'Your details, your say.', 'What we collect, why, and who sees it, in plain English.') + `
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box">
    <article class="prose">
      <!-- Draft for review by a qualified adviser before launch. Add company number, ICO registration and retention periods. -->
      <h2>What we collect</h2>
      <p>When you tell us about your move or ask for a callback, quote or quick-sale options, we collect what you give us: your name, phone number, email address and postcode, what you’re doing and the stage you’re at, and anything else you choose to tell us. If you ask us to email you a checklist, we collect your email address and postcode. If you’re a partner registering interest, we collect your name, firm, role, office postcode and contact details.</p>
      <h2>Why we collect it</h2>
      <ul>
        <li>To call you back and help you work out what you need.</li>
        <li>With your agreement, to introduce you to professionals who can help.</li>
        <li>To send you the checklist you asked for.</li>
      </ul>
      <h2>Who we share it with</h2>
      <p>Only the professionals you agree to be introduced to, such as a conveyancer, a mortgage broker, a surveyor or a removals firm. We tell you before any introduction is made, and we never sell your data.</p>
      <h2>How your details reach us</h2>
      <p>Forms on this site are delivered to our inbox by FormSubmit (formsubmit.co), an email-forwarding service used only to pass your details to us.</p>
      <h2 id="cookies" style="scroll-margin-top:90px">Cookies and storage</h2>
      <p>We don’t use advertising or analytics cookies. The site keeps two small things in your browser: your checklist progress, so your ticks are still there when you come back, and, for the length of your visit, the page you arrived on, so your enquiry tells us how you found us. You can clear both by clearing your browser data.</p>
      <h2>Your rights</h2>
      <p>Under UK data protection law you can ask to see, correct or delete your data, object to how we use it, or withdraw your agreement. Email <a href="mailto:${c.email}">${c.email}</a>. You can also complain to the Information Commissioner’s Office (ico.org.uk).</p>
    </article>
  </div>`;
}

function complaintsBody() {
  const c = CFG.contact;
  return simpleHero('Complaints', 'If something’s gone wrong, tell us.', 'We’d rather hear about a problem than have you put up with it.') + `
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box">
    <article class="prose">
      <!-- Draft for review before launch. -->
      <h2>How to complain</h2>
      <p>Email <a href="mailto:${c.email}">${c.email}</a> or call <a href="tel:${c.phoneHref}">${c.phone}</a>. Tell us what happened, what you’d like us to do, and your reference if you have one. It starts with PFY- and was shown when you sent your enquiry.</p>
      <h2>What happens next</h2>
      <p>We’ll confirm we’ve received your complaint, look into it, and reply with what we found and what we’ll do about it.</p>
      <h2>Complaints about a professional we introduced</h2>
      <p>Your contract for each service is with the professional who provides it, and each has its own complaints process. We’ll help you raise it with them. If a regulated firm doesn’t resolve your complaint, you may be able to take it further: to the Legal Ombudsman for solicitors and conveyancers, or the Financial Ombudsman Service for mortgage advice.</p>
    </article>
  </div>`;
}

function partnersBody() {
  const roles = ['Conveyancer or solicitor', 'Mortgage broker', 'Surveyor', 'Removals firm', 'Estate agent', 'Cash buyer or auction house', 'Other home service'];
  return simpleHero('For partners', 'Work with Properfy', 'Partner accounts are by invitation while we launch. If you’re a professional serving homes in England and Wales, register your interest and we’ll be in touch.') + `
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start">
    <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:12px">
      <h2 class="h2">How partners work</h2>
      <p style="margin:0;font-size:15px;color:var(--color-neutral-300);line-height:1.6">We talk to every customer first, work out what they need and only make an introduction once they’ve agreed. You get customers who know why you’re calling.</p>
      <ul class="ul" style="display:flex;flex-direction:column;gap:8px">${['Introductions agreed with the customer first', 'Customers in England and Wales only', 'We tell customers about any referral fee before an introduction'].map((t) => `<li style="display:flex;gap:10px;font-size:15px;line-height:1.45">${ic('check', 'color:var(--color-accent);margin-top:3px')}${t}</li>`).join('')}</ul>
    </div>
    <div style="flex:1 1 360px;min-width:0;max-width:480px;padding:20px;border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:12px">
      <form data-form="partner" novalidate style="display:flex;flex-direction:column;gap:12px">
        <h2 style="font-size:18px;font-weight:500;line-height:1.55;letter-spacing:0">Register interest</h2>
        ${field('Name', '<input class="input" name="name" placeholder="Your name" autocomplete="name">')}
        ${field('Firm', '<input class="input" name="firm" placeholder="Your firm" autocomplete="organization">')}
        ${field('What do you do?', select('role', roles))}
        ${field('Email', '<input class="input" name="email" placeholder="you@example.com" type="email" autocomplete="email">')}
        ${field('Phone (optional)', '<input class="input" name="phone" placeholder="020…" type="tel" autocomplete="tel">')}
        ${field('Office postcode', '<input class="input" name="postcode" placeholder="e.g. E8 3PL" autocomplete="postal-code" autocapitalize="characters">')}
        ${field('Anything else? (optional)', '<textarea class="input" name="message" rows="3"></textarea>')}
        ${honeypot()}
        ${err()}
        <button type="submit" class="btn btn-primary btn-block" style="height:44px;font-size:15px">Register interest${ic('arrow-right')}</button>
      </form>
      <div data-sent hidden role="status" style="display:flex;flex-direction:column;gap:12px">
        ${ic('ph-fill ph-check-circle', 'font-size:30px;color:var(--color-accent)')}
        <span style="font-size:18px;font-weight:500">Thanks <span data-first></span>, we’ve got it.</span>
        <span style="font-size:14px;color:var(--color-neutral-300)">We’ll be in touch about partner access soon.</span>
      </div>
    </div>
  </div>`;
}

function notFoundBody() {
  return simpleHero('Page not found', 'That page isn’t here.', 'It may have moved when we updated the site.') + `
  <div style="max-width:1180px;margin:0 auto;padding:0 var(--pad-x) 40px;box-sizing:border-box;display:flex;gap:10px;flex-wrap:wrap">
    <a href="${u(FILE.home)}" class="btn btn-primary" style="height:44px;padding:0 18px">Back to home${ic('arrow-right')}</a>
    <a href="${u(FILE.hub)}" class="btn btn-secondary" style="height:44px;padding:0 18px">${ic('question')}Ask a property question</a>
  </div>`;
}

/* ── Build ──────────────────────────────────────────────────────────────── */

write('index.html', { page: 'home', body: homeBody, ld: ORG_LD });

Object.keys(P.journeys).forEach((k) => {
  const j = P.journeys[k];
  write(jFile(k), {
    page: 'journey', active: k === 'buy' || k === 'sell' ? k : null,
    title: j.h1 + ' | Properfy', desc: j.intro,
    ld: { '@context': 'https://schema.org', '@type': 'HowTo', name: j.h1, step: j.stages.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.t, text: s.h })) },
    crumbs: [{ label: j.title }], ctx: { journey: k, doing: j.doing }, body: () => journeyBody(k)
  });
});

function servicePage(file, k, landing) {
  const s = P.services[k];
  write(file, {
    page: 'service', active: 'service', title: s.h1 + ' | Properfy', desc: s.intro, ld: faqLd(s.faqs),
    canonical: landing ? sFile(k) : null, landing,
    crumbs: [{ label: 'Services', svc: true }, { label: s.kicker }], ctx: { service: k, doing: s.doing }, body: () => serviceBody(k)
  });
}
SVC_KEYS.forEach((k) => servicePage(sFile(k), k, false));
Object.keys(P.aliases).forEach((slug) => servicePage(slug + '.html', P.aliases[slug], true));

write(FILE.specialist, { page: 'specialist', title: 'Specialist property transactions | Properfy', crumbs: [{ label: 'Specialist transactions' }], body: specialistBody });

const hubTitle = 'Property questions answered | Properfy Property Hub';
write(FILE.hub, { page: 'hub', active: 'hub', title: hubTitle, crumbs: [{ label: 'Property Hub' }], body: () => hubBody('buying') });
Object.keys(HUB_PAGES).forEach((id) => write(HUB_PAGES[id], { page: 'hub', active: 'hub', title: hubTitle, crumbs: [{ label: 'Property Hub' }], body: () => hubBody(id) }));

Object.keys(P.guides).forEach((id) => {
  const g = P.guides[id];
  const c = cat(g.cat);
  write(gFile(id), {
    page: 'article', active: 'hub', title: g.title + ' | Properfy', desc: g.answer.slice(0, 155),
    ld: faqLd([{ q: g.title, a: g.answer }].concat(g.follow || [])),
    crumbs: [{ label: 'Property Hub', href: FILE.hub }, { label: c.label, href: hubFile(c.id) }, { label: g.title }],
    ctx: { topic: g.title }, body: () => articleBody(id)
  });
});

write(FILE.checklists, { page: 'checklists', title: 'Home moving checklists | Properfy', crumbs: [{ label: 'Property Hub', href: FILE.hub }, { label: 'Checklists' }], body: checklistsBody });
write(FILE.glossary, { page: 'glossary', title: 'Property glossary: terms in plain English | Properfy', crumbs: [{ label: 'Property Hub', href: FILE.hub }, { label: 'Glossary' }], body: glossaryBody });
write(FILE.about, { page: 'about', active: 'about', title: 'About Properfy | How we work', crumbs: [{ label: 'About' }], body: aboutBody });

const quickSeo = { title: 'Sell your house fast: cash buyers, auction and fast-track sales | Properfy', desc: 'Need to sell quickly? Compare cash buyers, auction and fast-track agent sales honestly, and get your quick-sale options with no obligation.', ld: faqLd(P.quick.faqs) };
write(FILE.quick, { page: 'quick', active: 'quick', ...quickSeo, crumbs: [{ label: 'Sell your house fast' }], ctx: { doing: 'Quick sale' }, body: quickBody });
write('quick-house-sale.html', { page: 'quick', active: 'quick', ...quickSeo, canonical: FILE.quick, landing: true, crumbs: [{ label: 'Sell your house fast' }], ctx: { doing: 'Quick sale' }, body: quickBody });

const repoSeo = { title: 'Worried about repossession? Your options explained | Properfy', desc: 'Behind on your mortgage or facing repossession? Understand where you are, what to do now and where to get free advice, then request a confidential callback.', ld: faqLd(P.repo.faqs) };
write(FILE.repo, { page: 'repo', active: 'repo', ...repoSeo, band: false, crumbs: [{ label: 'Repossession help' }], ctx: { doing: 'Facing repossession' }, body: repoBody });
write('facing-repossession.html', { page: 'repo', active: 'repo', ...repoSeo, canonical: FILE.repo, landing: true, band: false, crumbs: [{ label: 'Repossession help' }], ctx: { doing: 'Facing repossession' }, body: repoBody });

write(FILE.privacy, { page: 'privacy', title: 'Privacy notice | Properfy', desc: 'What Properfy collects, why, and who sees it.', crumbs: [{ label: 'Privacy' }], body: privacyBody });
write(FILE.complaints, { page: 'complaints', title: 'Complaints | Properfy', desc: 'How to make a complaint to Properfy.', crumbs: [{ label: 'Complaints' }], body: complaintsBody });
write(FILE.partners, { page: 'partners', title: 'For partners | Properfy', desc: 'Conveyancers, brokers, surveyors and other home services in England and Wales: register your interest in working with Properfy.', crumbs: [{ label: 'For partners' }], band: false, body: partnersBody });
write('404.html', { page: 'notfound', title: 'Page not found | Properfy', base: '/', noindex: true, band: false, body: notFoundBody });

// sitemap.xml and robots.txt
const urls = built.filter((b) => b.sitemap).map((b) => `  <url><loc>${b.canonical}</loc></url>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${CFG.site}/sitemap.xml\n`);

console.log('Built ' + built.length + ' pages.');
