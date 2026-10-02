/*
  Properfy — behaviour
  Menus, the animated wordmark, the "Tell us about my move" / callback
  enquiry form, every other form (quote, quick sale, repossession, checklist,
  partners), Property Hub search, checklists and the glossary filter.

  Every form is emailed to the inbox in PFY.config.leadEndpoint and only
  accepts postcodes in England and Wales (PF.checkPostcode).
*/
(function (w, d) {
  'use strict';

  var PFY = w.PFY || {};
  var CFG = PFY.config || {};
  var UI = PFY.ui || {};
  var PF = (w.PF = w.PF || {});

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  var $ = function (sel, ctx) { return (ctx || d).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var icon = function (name, style) {
    return '<svg class="ph" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '><use href="#i-' + name + '"/></svg>';
  };
  var params = new URLSearchParams(w.location.search);
  var first = function (name) { return String(name || '').trim().split(/\s+/)[0]; };
  var store = {
    get: function (k, s) { try { return JSON.parse((s ? w.sessionStorage : w.localStorage).getItem(k)); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? w.sessionStorage : w.localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var ctx = (function () { try { return JSON.parse(d.body.getAttribute('data-ctx') || '{}'); } catch (e) { return {}; } })();
  var page = d.body.getAttribute('data-page');
  var landingPage = d.body.getAttribute('data-landing') === '1';

  PF.ref = function () {
    var n = Math.floor(Math.random() * 90000);
    if (w.crypto && w.crypto.getRandomValues) { var b = new Uint32Array(1); w.crypto.getRandomValues(b); n = b[0] % 90000; }
    return 'PFY-' + (10000 + n);
  };

  /* ── England and Wales only ───────────────────────────────────────────── */

  // Returns { ok, postcode } or { ok: false, message } ready to show.
  PF.checkPostcode = function (raw) {
    var area = CFG.serviceArea;
    var pc = String(raw || '').toUpperCase().replace(/\s+/g, '');
    var m = pc.match(/^([A-Z]{1,2})(\d[A-Z\d]?)(\d[A-Z]{2})$/);
    if (!m) return { ok: false, message: 'Please add the full postcode, for example E8 3PL.' };
    var district = m[1] + m[2];
    if (area.allowDistricts.indexOf(district) === -1) {
      for (var region in area.outside) {
        if (area.outside[region].indexOf(m[1]) !== -1) {
          return { ok: false, outside: true, message: 'Sorry, Properfy only covers ' + area.name + ', so we can’t help with ' + region + '.' };
        }
      }
    }
    return { ok: true, postcode: district + ' ' + m[3] };
  };

  // UK numbers only: 07… / 01… / 02… or +44 / 0044.
  PF.validUkPhone = function (v) {
    return /^(?:\+44|0044|0)[1-9]\d{8,9}$/.test(String(v || '').replace(/[\s().-]/g, ''));
  };
  PF.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); };

  // The design's checks, plus the UK phone rule. Returns an error or ''.
  function checkContact(o, needEmail) {
    if (!String(o.name || '').trim()) return { msg: 'Please add your name.', field: 'name' };
    var digits = String(o.phone || '').replace(/\D/g, '');
    if (digits.length < 10) return { msg: 'Please add a phone number we can call.', field: 'phone' };
    if (!PF.validUkPhone(o.phone)) return { msg: 'Please use a UK phone number, for example 07700 900123.', field: 'phone' };
    if ((needEmail || String(o.email || '').trim()) && !PF.validEmail(o.email)) return { msg: 'That email doesn’t look quite right.', field: 'email' };
    return null;
  }

  /* ── Where people came from, and tracking ─────────────────────────────── */

  var source = store.get('pfy-source', true);
  if (!source) {
    source = {
      source: params.get('utm_source') || (d.referrer && d.referrer.indexOf(w.location.host) === -1 ? d.referrer : '(direct)'),
      medium: params.get('utm_medium') || '(none)',
      campaign: params.get('utm_campaign') || '',
      adgroup: params.get('utm_content') || '',
      term: params.get('utm_term') || '',
      landing: w.location.pathname + w.location.search
    };
    store.set('pfy-source', source, true);
  }

  // Pushes to window.dataLayer, ready for Google Tag Manager if it's added.
  PF.track = function (type, lead, extra) {
    var ev = { event: type, is_lead: !!lead, page: w.location.pathname, landing_page: source.landing };
    ['source', 'medium', 'campaign', 'adgroup', 'term'].forEach(function (k) { ev[k] = source[k]; });
    for (var k in extra || {}) ev[k] = extra[k];
    (w.dataLayer = w.dataLayer || []).push(ev);
  };

  /* ── Sending enquiries ────────────────────────────────────────────────── */

  var SUBJECT = {
    move: function (p) { return 'New Properfy enquiry: ' + (p.doing || 'Not sure yet') + ' - ' + p.name + ' (' + p.postcode + ')'; },
    callback: function (p) { return 'Properfy callback request: ' + p.name + ' (' + p.postcode + ')'; },
    quote: function (p) { return 'Properfy quote request: ' + p.serviceLabel + ' - ' + p.name + ' (' + p.postcode + ')'; },
    quick: function (p) { return 'HIGH PRIORITY · Quick sale: ' + p.name + ' (' + p.postcode + ')'; },
    repo: function (p) { return (p.urgent ? 'URGENT · ' : '') + 'Repossession callback: ' + p.name + ' (' + p.postcode + ')'; },
    checklist: function (p) { return 'Checklist request: ' + p.checklist + ' (' + p.postcode + ')'; },
    partner: function (p) { return 'Properfy partner enquiry: ' + p.name + ', ' + p.firm; }
  };

  // rows: [label, value] pairs, shown in order in the email. "email" becomes
  // the reply-to address.
  PF.send = function (type, p, rows, extra) {
    var f = { _template: 'table', _captcha: 'false', _subject: SUBJECT[type](p) };
    if (p.honey) f._honey = p.honey;
    rows.forEach(function (r) { if (r[1] != null && r[1] !== '') f[r[0]] = r[1]; });
    if (p.email) f.email = p.email;
    f['Page'] = w.location.pathname;
    f['How they found us'] = source.source + ' / ' + source.medium + (source.campaign ? ' / ' + source.campaign : '') + (source.term ? ' / "' + source.term + '"' : '');
    f['First page they saw'] = source.landing;
    f['Sent'] = new Date().toLocaleString('en-GB');
    for (var k in extra || {}) f[k] = extra[k];

    var url = CFG.leadEndpoint;
    if (!url) {
      if (w.console) console.info('[Properfy preview] ' + type + ' not sent: set PFY.config.leadEndpoint', f);
      return Promise.resolve({ sent: false });
    }
    var ctrl = w.AbortController ? new AbortController() : null;
    var timer = ctrl ? w.setTimeout(function () { ctrl.abort(); }, 20000) : null;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(f),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.success === false || data.success === 'false') throw new Error(data.message || 'Request failed: ' + res.status);
        return { sent: true };
      });
    }).finally(function () { if (timer) w.clearTimeout(timer); });
  };
  var SEND_FAIL = 'That didn’t send. Check your connection and try again.';
  var previewNote = function (res) { return res && res.sent === false ? ' (preview: nothing was sent)' : ''; };

  /* ── Toast ────────────────────────────────────────────────────────────── */

  var toastEl = $('.toast'), toastTimer;
  PF.toast = function (msg) {
    if (!toastEl) return;
    toastEl.innerHTML = icon('check-circle-fill', 'color:var(--color-accent)') + '<span>' + esc(msg) + '</span>';
    w.clearTimeout(toastTimer);
    toastEl.classList.add('on');
    toastTimer = w.setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };

  /* ── Form helpers ─────────────────────────────────────────────────────── */

  function showErr(box, msg, field) {
    var el = $('.form-err', box);
    $$('[aria-invalid]', box).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    if (!msg) { if (el) el.hidden = true; return; }
    if (el) { $('span', el).textContent = msg; el.hidden = false; }
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }
  function busy(btn, on, label) {
    if (on) { btn.disabled = true; btn.setAttribute('data-label', btn.innerHTML); btn.textContent = label || 'Sending…'; }
    else { btn.disabled = false; btn.innerHTML = btn.getAttribute('data-label'); }
  }
  // Single-choice chip groups (or toggle-off groups with data-toggle).
  function chipGroup(group, onChange) {
    var value = '';
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-value]');
      if (!b) return;
      var v = b.getAttribute('data-value');
      value = group.hasAttribute('data-toggle') && value === v ? '' : v;
      $$('button[data-value]', group).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-value') === value)); });
      if (onChange) onChange(value);
    });
    return { get: function () { return value; } };
  }

  /* ── Header: services menu and mobile menu ────────────────────────────── */

  var svcMenu = $('#svc-menu');
  var mobileMenu = $('#mobile-menu');
  var burger = $('[data-burger]');
  var narrow = w.matchMedia('(max-width: 1119px)');

  function setSvc(open) {
    if (!svcMenu) return;
    svcMenu.hidden = !open;
    $$('.desk-nav [data-svc-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
  }
  function setMobile(open) {
    if (!mobileMenu) return;
    mobileMenu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    $('use', burger).setAttribute('href', open ? '#i-x' : '#i-list');
  }
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-svc-toggle]');
    if (t) {
      if (narrow.matches) { setMobile(true); w.scrollTo({ top: 0, behavior: 'smooth' }); }
      else setSvc(svcMenu.hidden);
      return;
    }
    if (e.target.closest('[data-burger]')) { setMobile(mobileMenu.hidden); return; }
    if (svcMenu && !svcMenu.hidden && !e.target.closest('#svc-menu')) setSvc(false);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setSvc(false); if (mobileMenu && !mobileMenu.hidden) { setMobile(false); burger.focus(); } }
  });

  /* ── Wordmark: properfy ↔ property, with a puff from the chimney ──────── */

  (function () {
    var letter = $('.wm-letter');
    if (!letter || w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var faces = { f: $('[data-face="f"]', letter), t: $('[data-face="t"]', letter) };
    var puffs = $$('.wm-puff');
    var n = 0;
    w.setInterval(function () {
      if (d.hidden) return;
      n += 1;
      var isT = n % 2 === 1;
      letter.style.transform = 'rotate(' + n * 360 + 'deg)';
      faces.f.style.opacity = isT ? 0 : 1;
      faces.t.style.opacity = isT ? 1 : 0;
      puffs.forEach(function (p) { p.classList.remove('go'); void p.getBoundingClientRect(); p.classList.add('go'); });
    }, 2400);
  })();

  /* ── Enquiry form: "Tell us about my move" and "Request a callback" ───── */

  var L = null, modal = null, lastFocus = null;
  var STAGE_TITLES = ['What are you doing?', 'What stage are you at?', 'What do you need help with?', 'Where can we reach you?'];
  var STAGE_SUBS = ['Pick the one closest. You can tell us more later.', 'Roughly is fine.', 'Optional, but it helps us prepare for your call.', 'So we can call you back.'];

  function chips(list, key, size) {
    return '<div style="display:flex;flex-wrap:wrap;gap:6px" role="group">' + list.map(function (x) {
      return '<button type="button" class="chip ' + size + '" data-l-key="' + key + '" data-value="' + esc(x) + '" aria-pressed="' + (L[key] === x) + '">' + esc(x) + '</button>';
    }).join('') + '</div>';
  }
  function input(label, key, attrs) {
    return '<div class="field"><label for="l-' + key + '">' + label + '</label><input class="input" id="l-' + key + '" data-l-input="' + key + '" value="' + esc(L[key]) + '" ' + attrs + '></div>';
  }

  function leadBody() {
    var move = L.mode === 'move';
    if (L.done) {
      return '<div style="display:flex;flex-direction:column;gap:14px">' + icon('check-circle-fill', 'font-size:34px;color:var(--color-accent)') +
        '<div style="padding:14px;border-radius:8px;background:var(--color-bg);display:flex;flex-direction:column;gap:10px"><span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent)">What happens next?</span>' +
        '<ol class="ul" style="display:flex;flex-direction:column;gap:8px">' + UI.after.map(function (t, i) { return '<li style="display:flex;gap:12px;font-size:14px"><span style="color:var(--color-accent-300);width:16px">' + (i + 1) + '</span>' + esc(t) + '</li>'; }).join('') + '</ol></div>' +
        '<span style="font-size:13px;color:var(--color-neutral-400)">Your reference: ' + esc(L.ref) + esc(L.note || '') + '</span></div>';
    }
    if (move && L.step === 0) return chips(UI.doing, 'doing', 'chip-l');
    if (move && L.step === 1) return chips(UI.stages, 'stage', 'chip-l');
    if (move && L.step === 2) {
      return '<div class="field"><label for="l-help">What do you need help with?</label><textarea class="input" id="l-help" data-l-input="help" rows="4" placeholder="For example: we’ve had an offer accepted on a leasehold flat and need a solicitor and a survey." style="resize:vertical;min-height:96px;font-family:inherit">' + esc(L.help) + '</textarea></div>' +
        '<div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">Best time to call</span>' + chips(UI.times, 'time', 'chip-m') + '</div>';
    }
    return input('Name', 'name', 'placeholder="Your name" autocomplete="name"') +
      input('Phone', 'phone', 'placeholder="07…" type="tel" autocomplete="tel"') +
      (move ? input('Email', 'email', 'placeholder="you@example.com" type="email" autocomplete="email"') : '') +
      input('Postcode', 'postcode', 'placeholder="e.g. E8 3PL" autocomplete="postal-code" autocapitalize="characters"') +
      (move ? '' : '<div class="field"><span style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb,var(--color-text) 70%,transparent)">Best time to call</span>' + chips(UI.times, 'time', 'chip-m') + '</div>') +
      '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" data-l-input="honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<span style="font-size:12px;color:var(--color-neutral-500);line-height:1.5">We’ll only use your details to help with your enquiry and to introduce you to relevant professionals, with your agreement.</span>';
  }

  function renderLead() {
    var move = L.mode === 'move';
    var kicker = L.done ? 'Thank you' : L.topic ? L.topic : move ? 'Tell us about your move' : 'Callback';
    var title = L.done ? 'Thanks' + (L.name ? ', ' + first(L.name) : '') + '. We’ll be in touch.' : move ? STAGE_TITLES[L.step] : 'Request a callback';
    var sub = L.done ? 'Here’s what happens now.' : move ? STAGE_SUBS[L.step] : 'Leave your number and we’ll call you at a time that suits.';
    var next = L.done ? 'Done' : move && L.step < 3 ? (L.step === 2 ? 'Continue' : 'Next') : move ? 'Tell us about my move' : 'Request my callback';
    var dots = move && !L.done ? '<div style="display:flex;gap:5px" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<div style="flex:1;height:3px;border-radius:2px;transition:background .2s;background:' + (i <= L.step ? 'var(--color-accent)' : 'var(--color-neutral-800)') + '"></div>'; }).join('') + '</div>' : '';
    var dialog = $('.dialog', modal);
    dialog.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
      '<div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)">' + esc(kicker) + '</span><h2 id="lead-title" class="dialog-title" style="font-size:22px;margin:0;line-height:1.55;letter-spacing:0">' + esc(title) + '</h2><span style="font-size:14px;color:var(--color-neutral-400)">' + esc(sub) + '</span></div>' +
      '<button type="button" class="btn btn-ghost btn-icon" data-l-close aria-label="Close">' + icon('x', 'font-size:18px') + '</button></div>' +
      dots +
      '<form novalidate data-l-form style="display:flex;flex-direction:column;gap:16px">' + leadBody() +
      '<p class="form-err" role="alert"' + (L.err ? '' : ' hidden') + ' style="margin:0;font-size:13px;color:var(--color-accent-200);display:flex;gap:6px;align-items:baseline">' + icon('warning-circle') + '<span>' + esc(L.err) + '</span></p>' +
      '<div class="dialog-actions" style="display:flex;gap:8px;justify-content:space-between">' +
      (move && L.step > 0 && !L.done ? '<button type="button" class="btn btn-ghost" data-l-back>Back</button>' : '') +
      '<div style="margin-left:auto"><button type="submit" class="btn btn-primary" data-l-next style="height:42px;padding:0 18px">' + esc(next) + '</button></div></div></form>';
    var focusEl = $('[data-l-input]:not([data-l-input="honey"]), button[aria-pressed="true"], .chip', dialog) || $('[data-l-next]', dialog);
    if (L.done) focusEl = $('[data-l-next]', dialog);
    focusEl.focus({ preventScroll: true });
  }

  function openLead(mode, extra) {
    var c = {};
    for (var k in ctx) c[k] = ctx[k];
    for (k in extra || {}) c[k] = extra[k];
    L = {
      mode: mode, step: mode === 'callback' ? 3 : 0, doing: c.doing || '', stage: c.stage || '', help: c.help || '', time: '',
      name: '', phone: '', email: '', postcode: '', honey: '', err: '', done: false, ref: '',
      service: c.service || '', journey: c.journey || '', topic: c.topic || ''
    };
    PF.track('cta_click', false, { cta: mode, service: L.service, journey: L.journey });
    lastFocus = d.activeElement;
    if (!modal) {
      modal = d.createElement('div');
      modal.className = 'dialog-backdrop';
      modal.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="lead-title"></div>';
      d.body.appendChild(modal);
      modal.addEventListener('click', onModalClick);
      modal.addEventListener('input', function (e) {
        var key = e.target.getAttribute('data-l-input');
        if (key) { L[key] = e.target.value; e.target.removeAttribute('aria-invalid'); }
      });
      modal.addEventListener('submit', function (e) { e.preventDefault(); leadNext(); });
      modal.addEventListener('keydown', onModalKey);
    }
    modal.hidden = false;
    d.body.classList.add('modal-open');
    renderLead();
  }
  PF.openLead = openLead;

  function closeLead() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    d.body.classList.remove('modal-open');
    L = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function onModalClick(e) {
    if (e.target === modal || e.target.closest('[data-l-close]')) { closeLead(); return; }
    if (e.target.closest('[data-l-back]')) { L.step -= 1; L.err = ''; renderLead(); return; }
    var chip = e.target.closest('button[data-l-key]');
    if (chip) {
      var key = chip.getAttribute('data-l-key');
      L[key] = chip.getAttribute('data-value');
      L.err = '';
      $$('button[data-l-key="' + key + '"]', modal).forEach(function (b) { b.setAttribute('aria-pressed', String(b === chip)); });
      showErr(modal, '');
    }
  }

  function onModalKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeLead(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button:not([disabled]), input:not([tabindex="-1"]), textarea, select', $('.dialog', modal));
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  function leadNext() {
    if (L.done) { closeLead(); return; }
    var move = L.mode === 'move';
    var setErr = function (msg, key) {
      L.err = msg;
      showErr(modal, msg, key ? $('[data-l-input="' + key + '"]', modal) : null);
    };
    if (move && L.step === 0 && !L.doing) return setErr('Pick the one closest to what you’re doing.');
    if (move && L.step === 1 && !L.stage) return setErr('Pick the stage you’re at.');
    if (move && L.step < 3) { L.step += 1; L.err = ''; renderLead(); return; }

    var bad = checkContact(L, move);
    if (bad) return setErr(bad.msg, bad.field);
    var area = PF.checkPostcode(L.postcode);
    if (!area.ok) return setErr(area.message, 'postcode');
    L.postcode = area.postcode;

    var ref = PF.ref();
    var btn = $('[data-l-next]', modal);
    busy(btn, true);
    var svc = L.service && PFY.services[L.service];
    var j = L.journey && PFY.journeys[L.journey];
    PF.send(move ? 'move' : 'callback', L, [
      ['Reference', ref],
      ['Type', move ? 'Move enquiry' : 'Callback request'],
      ['Name', L.name.trim()],
      ['Phone', L.phone.trim()],
      ['Postcode', L.postcode],
      ['What they’re doing', L.doing],
      ['Stage', L.stage],
      ['What they need help with', L.help.trim()],
      ['Best time to call', L.time || 'Any time'],
      ['About', L.topic],
      ['Service page', svc ? svc.h1 : ''],
      ['Journey page', j ? j.title : '']
    ]).then(function (res) {
      PF.track(move ? 'move_enquiry' : 'callback_request', true, { service: L.service, journey: L.journey, doing: L.doing, stage: L.stage });
      L.done = true; L.ref = ref; L.err = ''; L.note = previewNote(res);
      renderLead();
    }).catch(function () {
      busy(btn, false);
      setErr(SEND_FAIL);
    });
  }

  d.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { w.location.href = go.getAttribute('data-go'); return; }
    var t = e.target.closest('[data-lead]');
    if (!t) return;
    e.preventDefault();
    var extra = {};
    try { extra = JSON.parse(t.getAttribute('data-lead-extra') || '{}'); } catch (err) { /* ignore */ }
    openLead(t.getAttribute('data-lead'), extra);
  });

  /* ── Home: "Where are you in your move?" ──────────────────────────────── */

  (function () {
    var box = $('[data-situations]');
    if (!box) return;
    var STAGE = { offer: 'Offer accepted', exchanged: 'Exchanged', moving: 'Completion approaching', buy: 'Looking for a property', both: 'Just considering moving' };
    var steps = $('[data-sit-steps]', box), cta = $('[data-sit-cta]', box), link = $('[data-sit-journey]', box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sit]');
      if (!b) return;
      var sit = PFY.situations.filter(function (x) { return x.id === b.getAttribute('data-sit'); })[0];
      $$('[data-sit]', box).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      steps.innerHTML = sit.steps.map(function (t, i) {
        return '<li style="display:flex;gap:12px;align-items:baseline"><span style="flex:none;width:18px;font-size:12px;color:var(--color-accent-300);font-variant-numeric:tabular-nums">' + (i + 1) + '</span><span style="font-size:14px">' + esc(t) + '</span></li>';
      }).join('');
      $('span', cta).textContent = sit.cta;
      if (sit.id === 'moving') {
        cta.removeAttribute('data-lead');
        cta.setAttribute('data-go', 'removal-quote.html');
      } else {
        cta.removeAttribute('data-go');
        cta.setAttribute('data-lead', 'move');
        cta.setAttribute('data-lead-extra', JSON.stringify({ doing: sit.journey ? PFY.journeys[sit.journey].doing : '', stage: STAGE[sit.id] || '' }));
      }
      link.hidden = !sit.journey;
      if (sit.journey) link.href = PFY.journeys[sit.journey].slug + '.html';
    });
  })();

  /* ── Service pages: quote form ────────────────────────────────────────── */

  (function () {
    var form = $('[data-form="quote"]');
    if (!form) return;
    var box = form.parentNode;
    var key = form.getAttribute('data-service');
    var S = PFY.services[key];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      var p = { name: el.name.value.trim(), phone: el.phone.value.trim(), email: el.email.value.trim(), postcode: el.postcode.value, stage: el.stage.value, honey: el._honey.value, serviceLabel: S.kicker };
      var bad = checkContact(p, true);
      if (bad) return showErr(form, bad.msg, el[bad.field]);
      var area = PF.checkPostcode(p.postcode);
      if (!area.ok) return showErr(form, area.message, el.postcode);
      p.postcode = area.postcode;
      showErr(form, '');
      var ref = PF.ref();
      var btn = $('[type="submit"]', form);
      busy(btn, true);
      PF.send('quote', p, [
        ['Reference', ref], ['Type', 'Quote request'], ['Service', S.h1], ['Name', p.name], ['Phone', p.phone],
        ['Postcode', p.postcode], ['Stage', p.stage || 'Not given'], ['Ad landing page', landingPage ? 'Yes' : '']
      ]).then(function (res) {
        PF.track('quote_request', true, { service: key, stage: p.stage, landing: landingPage });
        form.hidden = true;
        var sent = $('[data-sent]', box);
        $('[data-first]', sent).textContent = first(p.name);
        $('[data-ref]', sent).textContent = ref + previewNote(res);
        sent.hidden = false;
      }).catch(function () { busy(btn, false); showErr(form, SEND_FAIL); });
    });
  })();

  /* ── Sell your house fast ─────────────────────────────────────────────── */

  (function () {
    var form = $('[data-form="quick"]');
    if (!form) return;
    var box = $('#qs-form');
    var reason = chipGroup($('[data-chips="reason"]'));
    var type = chipGroup($('[data-chips="type"]', form));
    var time = chipGroup($('[data-chips="time"]', form));
    var step0 = $('[data-step="0"]', form), step1 = $('[data-step="1"]', form);
    var el = form.elements;
    var postcode = '';

    $('[data-next]', form).addEventListener('click', function () {
      var raw = el.postcode.value;
      if (raw.replace(/\s/g, '').length < 5) return showErr(step0, 'Please add the property’s postcode.', el.postcode);
      var area = PF.checkPostcode(raw);
      if (!area.ok) return showErr(step0, area.message, el.postcode);
      if (!type.get()) return showErr(step0, 'Choose the property type.');
      if (!time.get()) return showErr(step0, 'Tell us how quickly you need to sell.');
      showErr(step0, '');
      postcode = area.postcode;
      el.postcode.value = postcode;
      PF.track('quick_sale_step1', false, { stage: time.get() });
      step0.hidden = true; step1.hidden = false;
      el.name.focus();
    });
    $('[data-back]', form).addEventListener('click', function () { step1.hidden = true; step0.hidden = false; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (step1.hidden) { $('[data-next]', form).click(); return; }
      var p = { name: el.name.value.trim(), phone: el.phone.value.trim(), email: el.email.value.trim(), postcode: postcode, honey: el._honey.value };
      var bad = checkContact(p, false);
      if (bad) return showErr(step1, bad.msg, el[bad.field]);
      showErr(step1, '');
      var ref = PF.ref();
      var btn = $('[type="submit"]', form);
      busy(btn, true);
      PF.send('quick', p, [
        ['Reference', ref], ['Type', 'Quick sale (high priority)'], ['Name', p.name], ['Phone', p.phone], ['Property postcode', p.postcode],
        ['Why they need to sell quickly', reason.get() || 'Not given'], ['Property type', type.get()], ['Rough value', el.value.value || 'Not given'],
        ['Mortgage', el.mortgage.value || 'Not given'], ['How quickly', time.get()], ['Ad landing page', landingPage ? 'Yes' : '']
      ]).then(function (res) {
        PF.track('quick_sale_enquiry', true, { service: 'quick-sale', doing: 'Quick sale · ' + (reason.get() || 'no reason given'), stage: time.get(), priority: 'high' });
        form.hidden = true;
        var sent = $('[data-sent]', box);
        $('[data-first]', sent).textContent = first(p.name);
        $('[data-ref]', sent).textContent = ref + previewNote(res);
        sent.hidden = false;
      }).catch(function () { busy(btn, false); showErr(step1, SEND_FAIL); });
    });
  })();

  /* ── Repossession help ────────────────────────────────────────────────── */

  (function () {
    var root = $('[data-repo]');
    if (!root) return;
    var RP = PFY.repo, NEON = UI.neon;
    var stageId = RP.stages[0].id;
    var form = $('[data-form="repo"]', root), box = $('#rp-form');
    var el = form.elements;
    var want = chipGroup($('[data-chips="want"]', form));
    var time = chipGroup($('[data-chips="time"]', form));
    var vm = true, vmBtn = $('[data-vm]', form);

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-stage]');
      if (!b) return;
      stageId = b.getAttribute('data-stage');
      $$('[data-stage]', root).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var si = 0;
      RP.stages.forEach(function (s, i) { if (s.id === stageId) si = i; });
      var st = RP.stages[si], uc = [NEON[1], NEON[5], NEON[4], NEON[4], NEON[3]][si];
      $('[data-stage-label]', root).textContent = st.label;
      $('[data-stage-name]', root).textContent = st.label;
      var u = $('[data-stage-urgency]', root);
      u.textContent = st.urgency;
      u.style.background = uc + '22';
      u.style.boxShadow = 'inset 0 0 0 1px ' + uc;
      $('[data-stage-what]', root).textContent = st.what;
      $('[data-stage-now]', root).innerHTML = st.now.map(function (t, i) {
        return '<li style="display:flex;gap:12px;font-size:15px;line-height:1.45"><span style="flex:none;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #29b6f6;display:flex;align-items:center;justify-content:center;font-size:11px;color:#29b6f6">' + (i + 1) + '</span>' + esc(t) + '</li>';
      }).join('');
    });
    vmBtn.addEventListener('click', function () {
      vm = !vm;
      vmBtn.setAttribute('aria-checked', String(vm));
      vmBtn.style.background = vm ? NEON[0] : 'var(--color-neutral-700)';
      vmBtn.firstChild.style.left = vm ? '21px' : '3px';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = { name: el.name.value.trim(), phone: el.phone.value.trim(), postcode: el.postcode.value, honey: el._honey.value };
      var bad = checkContact(p, false);
      if (bad) return showErr(form, bad.msg, el[bad.field]);
      var area = PF.checkPostcode(p.postcode);
      if (!area.ok) return showErr(form, area.message, el.postcode);
      p.postcode = area.postcode;
      showErr(form, '');
      var st = RP.stages.filter(function (s) { return s.id === stageId; })[0];
      p.urgent = ['court', 'order', 'eviction'].indexOf(stageId) !== -1;
      var t = time.get();
      var ref = PF.ref();
      var btn = $('[type="submit"]', form);
      busy(btn, true);
      PF.send('repo', p, [
        ['Reference', ref], ['Type', 'Repossession callback (' + (p.urgent ? 'urgent' : 'high priority') + ')'], ['Name', p.name], ['Phone', p.phone],
        ['Postcode', p.postcode], ['Where they are', st.label], ['How far behind', el.behind.value || 'Not given'],
        ['What they’d like to happen', want.get() || 'Not sure'], ['Best time to call', t || 'As soon as possible'],
        ['OK to leave a voicemail', vm ? 'Yes' : 'No'], ['Ad landing page', landingPage ? 'Yes' : '']
      ]).then(function (res) {
        PF.track('repossession_enquiry', true, { service: 'repossession-help', doing: 'Facing repossession · ' + (want.get() || 'unsure'), stage: st.label + ' · ' + (el.behind.value || 'arrears n/a'), priority: p.urgent ? 'urgent' : 'high' });
        form.hidden = true;
        var sent = $('[data-sent]', box);
        $('[data-first]', sent).textContent = first(p.name);
        $('[data-when]', sent).textContent = !t || t === 'As soon as possible' ? 'as soon as we can' : 'in the ' + t.toLowerCase();
        $('[data-urgent]', sent).hidden = !p.urgent;
        $('[data-ref]', sent).textContent = ref + previewNote(res);
        sent.hidden = false;
      }).catch(function () { busy(btn, false); showErr(form, SEND_FAIL); });
    });
  })();

  /* ── Property Hub: search and topics ──────────────────────────────────── */

  (function () {
    var input = $('[data-hub-q]');
    if (!input) return;
    var out = $('[data-hub-results]');
    var STOP = {};
    UI.stop.split(' ').forEach(function (s) { STOP[s] = 1; });
    var gPath = function (id) {
      var g = PFY.guides[id];
      return PFY.cats.filter(function (c) { return c.id === g.cat; })[0].root + '/' + g.slug + '.html';
    };

    function search(q) {
      var words = q.toLowerCase().split(/[^a-z0-9’']+/).filter(function (x) { return x.length > 2 && !STOP[x]; });
      if (!words.length) return [];
      var score = function (t) { var l = t.toLowerCase(); return words.reduce(function (n, x) { return n + (l.indexOf(x) !== -1 ? 1 : 0); }, 0); };
      var res = [];
      Object.keys(PFY.guides).forEach(function (id) {
        var g = PFY.guides[id], best = g.title, bs = score(g.title) * 1.2;
        g.qs.forEach(function (x) { var s = score(x); if (s > bs) { bs = s; best = x; } });
        if (bs > 0) res.push({ kind: 'Guide', title: best, sub: g.answer.slice(0, 130) + '…', s: bs + score(g.answer) * 0.3, href: gPath(id) });
      });
      Object.keys(PFY.services).forEach(function (k) {
        var s = PFY.services[k], sc = score(s.h1 + ' ' + s.kicker);
        if (sc > 0) res.push({ kind: 'Service', title: s.h1, sub: s.intro.slice(0, 120), s: sc * 0.9, href: s.slug + '.html' });
      });
      PFY.glossary.forEach(function (g) {
        var sc = score(g.t);
        if (sc > 0) res.push({ kind: 'Glossary', title: g.t, sub: g.d, s: sc * 0.8, href: 'glossary.html?q=' + encodeURIComponent(g.t) });
      });
      return res.sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    }

    function render() {
      var q = input.value.trim();
      if (q.length < 2) { out.hidden = true; out.innerHTML = ''; return; }
      var r = search(q);
      out.hidden = false;
      out.innerHTML = '<h2 style="font-size:18px;margin-bottom:8px">' + (r.length ? r.length + ' result' + (r.length > 1 ? 's' : '') + ' for “' + esc(q) + '”' : 'No results for “' + esc(q) + '”') + '</h2>' +
        r.map(function (x) {
          return '<a href="' + esc(x.href) + '" class="lk hv-row" style="padding:14px 8px;border-radius:8px;display:flex;gap:14px;background:var(--fade-rule)"><span class="tag tag-neutral" style="flex:none;align-self:flex-start">' + x.kind + '</span><div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:15px;font-weight:500">' + esc(x.title) + '</span><span style="font-size:13px;color:var(--color-neutral-400);line-height:1.45">' + esc(x.sub) + '</span></div></a>';
        }).join('') +
        (r.length ? '' : '<div style="padding:18px;border-radius:8px;background:var(--color-surface);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><span style="font-size:14px;color:var(--color-neutral-300)">We haven’t written that one up yet. Ask us directly and we’ll help.</span><button type="button" class="btn btn-primary" data-lead="move" data-lead-extra="' + esc(JSON.stringify({ help: q })) + '">Ask Properfy</button></div>');
    }

    input.addEventListener('input', render);
    $('[data-hub-search]').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    $$('[data-example]').forEach(function (b) { b.addEventListener('click', function () { input.value = b.textContent; render(); }); });
    if (params.get('q')) { input.value = params.get('q'); render(); }

    var tabs = $$('[data-cat]');
    function pick(id) {
      if (!$('[data-cat-panel="' + id + '"]')) return;
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-cat') === id)); });
      $$('[data-cat-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-cat-panel') !== id; });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { pick(t.getAttribute('data-cat')); }); });
    if (params.get('cat')) pick(params.get('cat'));
  })();

  /* ── Checklists ───────────────────────────────────────────────────────── */

  (function () {
    var root = $('[data-checklists]');
    if (!root) return;
    var checks = store.get('pfy-checks') || {};
    var current = PFY.checklists[0].id;

    function refresh() {
      PFY.checklists.forEach(function (c) {
        var done = c.items.filter(function (_, i) { return checks[c.id + ':' + i]; }).length;
        var tab = $('[data-cl-tab="' + c.id + '"]', root);
        $('[data-cl-prog]', tab).textContent = done ? done + '/' + c.items.length : '';
        var on = c.id === current;
        tab.setAttribute('aria-pressed', String(on));
        tab.style.background = on ? 'var(--color-surface)' : 'transparent';
        tab.style.color = on ? 'var(--color-text)' : 'var(--color-neutral-300)';
        var panel = $('[data-cl-panel="' + c.id + '"]', root);
        panel.hidden = !on;
        $('[data-cl-label]', panel).textContent = done + ' of ' + c.items.length + ' done';
        $('[data-cl-bar]', panel).style.width = Math.round(done / c.items.length * 100) + '%';
        $$('[data-cl-item]', panel).forEach(function (b) {
          var d1 = !!checks[b.getAttribute('data-cl-item')];
          b.setAttribute('aria-checked', String(d1));
          b.style.color = d1 ? 'var(--color-neutral-400)' : 'var(--color-text)';
          $('[data-text]', b).style.textDecoration = d1 ? 'line-through' : 'none';
          var box = $('[data-box]', b);
          box.style.boxShadow = 'inset 0 0 0 1.5px ' + (d1 ? 'var(--color-accent)' : 'var(--color-neutral-600)');
          box.style.background = d1 ? 'var(--color-accent-700)' : 'transparent';
          $('svg', box).style.visibility = d1 ? 'visible' : 'hidden';
        });
      });
    }

    root.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-cl-tab]');
      if (tab) {
        current = tab.getAttribute('data-cl-tab');
        $('[data-sent]', root).hidden = true;
        $('[data-form="checklist"]', root).hidden = false;
        refresh();
        return;
      }
      var item = e.target.closest('[data-cl-item]');
      if (item) {
        var k = item.getAttribute('data-cl-item');
        if (checks[k]) delete checks[k]; else checks[k] = true;
        store.set('pfy-checks', checks);
        refresh();
      }
      if (e.target.closest('[data-print]')) w.print();
    });

    var form = $('[data-form="checklist"]', root);
    var box = form.parentNode;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      var email = el.email.value.trim();
      if (!PF.validEmail(email)) return showErr(box, 'Add an email address first.', el.email);
      var area = PF.checkPostcode(el.postcode.value);
      if (!area.ok) return showErr(box, area.message, el.postcode);
      showErr(box, '');
      var c = PFY.checklists.filter(function (x) { return x.id === current; })[0];
      var btn = $('[type="submit"]', form);
      busy(btn, true, 'Sending…');
      PF.send('checklist', { email: email, postcode: area.postcode, checklist: c.title, honey: el._honey.value }, [
        ['Type', 'Checklist request'], ['Checklist', c.title], ['Postcode', area.postcode]
      ], {
        _autoresponse: 'Here’s your ' + c.title.toLowerCase() + ' from Properfy.\n\n' + c.items.map(function (t) { return '☐ ' + t; }).join('\n') +
          '\n\nTick things off as you go at ' + CFG.site + '/checklists.html. If you’d like help with any of it, just reply to this email.'
      }).then(function () {
        PF.track('checklist_download', false, { checklist: c.id });
        busy(btn, false);
        form.hidden = true;
        $('[data-sent]', root).hidden = false;
      }).catch(function () { busy(btn, false); showErr(box, SEND_FAIL); });
    });

    var hash = w.location.hash.replace('#', '');
    if (hash && PFY.checklists.some(function (c) { return c.id === hash; })) current = hash;
    refresh();
  })();

  /* ── Glossary filter ──────────────────────────────────────────────────── */

  (function () {
    var input = $('[data-gl-q]');
    if (!input) return;
    var none = $('[data-gl-none]');
    function filter() {
      var q = input.value.trim().toLowerCase(), shown = 0;
      $$('[data-term]').forEach(function (t) {
        var on = !q || t.getAttribute('data-term').indexOf(q) !== -1;
        t.hidden = !on;
        if (on) shown += 1;
      });
      none.hidden = shown > 0;
    }
    input.addEventListener('input', filter);
    if (params.get('q')) { input.value = params.get('q'); filter(); }
  })();

  /* ── Partners ─────────────────────────────────────────────────────────── */

  (function () {
    var form = $('[data-form="partner"]');
    if (!form) return;
    var box = form.parentNode;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      var p = { name: el.name.value.trim(), firm: el.firm.value.trim(), role: el.role.value, email: el.email.value.trim(), phone: el.phone.value.trim(), postcode: el.postcode.value, message: el.message.value.trim(), honey: el._honey.value };
      if (!p.name) return showErr(form, 'Please add your name.', el.name);
      if (!p.firm) return showErr(form, 'Please add your firm’s name.', el.firm);
      if (!PF.validEmail(p.email)) return showErr(form, 'That email doesn’t look quite right.', el.email);
      if (p.phone && !PF.validUkPhone(p.phone)) return showErr(form, 'Please use a UK phone number, for example 020 7946 0000.', el.phone);
      var area = PF.checkPostcode(p.postcode);
      if (!area.ok) return showErr(form, area.message, el.postcode);
      p.postcode = area.postcode;
      showErr(form, '');
      var btn = $('[type="submit"]', form);
      busy(btn, true);
      PF.send('partner', p, [
        ['Type', 'Partner enquiry'], ['Name', p.name], ['Firm', p.firm], ['What they do', p.role || 'Not given'],
        ['Phone', p.phone || 'Not given'], ['Office postcode', p.postcode], ['Message', p.message || '—']
      ]).then(function () {
        form.hidden = true;
        var sent = $('[data-sent]', box);
        $('[data-first]', sent).textContent = first(p.name);
        sent.hidden = false;
      }).catch(function () { busy(btn, false); showErr(form, SEND_FAIL); });
    });
  })();
})(window, document);
