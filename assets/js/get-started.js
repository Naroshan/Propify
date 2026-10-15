/*
  Properfy — Get started (properfy.co.uk/get-started/)
  Choose a transaction, give your details, read and accept the agreement,
  sign, then pay by card (Stripe Checkout) or bank transfer (Tide).
  Everything is sent to the onboarding API (onboarding-api/), which saves
  the signed PDF privately and emails it to the client and Properfy.
*/
(function (w, d) {
  'use strict';

  var PFY = w.PFY || {};
  var CFG = PFY.config || {};
  var PF = w.PF || {};
  var API = w.PFY_ONBOARDING_API || CFG.onboardingApi;
  var root = d.querySelector('[data-gs]');
  if (!root) return;

  var $ = function (sel, ctx) { return (ctx || d).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); };
  var form = $('[data-gs-form]');
  var el = form.elements;
  var errBox = $('[data-gs-err]');
  var submitBtn = $('[data-gs-submit]');
  var done = $('[data-gs-done]');
  var agreementVersion = form.getAttribute('data-agreement-version');
  var coolingDays = Number(form.getAttribute('data-cooling-off-days')) || 14;
  var params = new URLSearchParams(w.location.search);
  var first = function (n) { return String(n || '').trim().split(/\s+/)[0]; };
  var pounds = function (p) { return '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: p % 100 ? 2 : 0 }); };

  /* ── Summary and helper text ──────────────────────────────────────── */

  function startDate() {
    var dt = new Date();
    dt.setDate(dt.getDate() + coolingDays + 1);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function selected() { var r = form.querySelector('input[name="transaction"]:checked'); return r ? { id: r.value, label: r.getAttribute('data-label'), pence: Number(r.getAttribute('data-pence')) } : null; }
  function payMethod() { var r = form.querySelector('input[name="payment"]:checked'); return r ? r.value : 'card'; }

  function refresh() {
    var tx = selected();
    var bank = payMethod() === 'bank';
    $('[data-sum-tx]').textContent = tx ? tx.label : 'Not chosen yet';
    $('[data-sum-fee]').textContent = tx ? pounds(tx.pence) : '–';
    $('[data-sum-pay]').textContent = bank ? 'Bank transfer' : 'Card (Stripe)';
    var early = el.earlyStart.checked;
    $('[data-sum-start]').textContent = early ? 'Straight away' : 'From ' + startDate();
    $('[data-gs-start]').textContent = early
      ? 'You’ve asked us to start straight away, during your 14-day cooling-off period.'
      : 'If you don’t tick the second box, we won’t start work until your 14-day cooling-off period has ended, on ' + startDate() + '.';
    var area = PF.checkPostcode ? PF.checkPostcode(el.postcode.value) : { ok: false };
    $('[data-gs-ref]').textContent = area.ok ? area.postcode + ' as the reference' : 'as the reference';
    $('[data-gs-bank-note]').hidden = !bank;
    var amount = tx ? ' ' + pounds(tx.pence) : '';
    submitBtn.firstChild.nodeValue = bank ? 'Sign and get bank details' : 'Sign and pay' + amount + ' securely';
    var name = el.name.value.trim();
    $('[data-gs-signing]').textContent = name ? 'Signing as ' + name + ' on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.' : '';
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  /* ── Signature: draw or type ──────────────────────────────────────── */

  var canvas = $('[data-sig-canvas]');
  var ctx = canvas.getContext('2d');
  var strokes = [], current = null, mode = 'draw';
  var pad = $('[data-sig-pad]'), typedBox = $('[data-sig-typed]'), hint = $('[data-sig-hint]');

  function sizeCanvas() {
    var r = canvas.getBoundingClientRect();
    var dpr = w.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  function drawStroke(c, s, color, scale) {
    if (!s.length) return;
    c.strokeStyle = color; c.lineWidth = 2.4 * (scale || 1); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(s[0][0] * (scale || 1), s[0][1] * (scale || 1));
    if (s.length === 1) c.lineTo(s[0][0] * (scale || 1) + 0.1, s[0][1] * (scale || 1));
    for (var i = 1; i < s.length; i++) c.lineTo(s[i][0] * (scale || 1), s[i][1] * (scale || 1));
    c.stroke();
  }
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(function (s) { drawStroke(ctx, s, '#e9e9ed'); });
    hint.style.opacity = strokes.length ? 0 : 1;
  }
  function pos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    current = [pos(e)];
    strokes.push(current);
    pad.removeAttribute('aria-invalid');
    redraw();
  });
  canvas.addEventListener('pointermove', function (e) { if (!current) return; current.push(pos(e)); redraw(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { canvas.addEventListener(t, function () { current = null; }); });
  $('[data-sig-clear]').addEventListener('click', function () { strokes = []; redraw(); });
  w.addEventListener('resize', sizeCanvas);
  sizeCanvas();

  $$('[data-sig-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-sig-mode');
      $$('[data-sig-mode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      pad.hidden = mode !== 'draw';
      typedBox.hidden = mode !== 'type';
      if (mode === 'type') { if (!el.typedSignature.value) el.typedSignature.value = el.name.value.trim(); preview(); el.typedSignature.focus(); }
      else sizeCanvas();
    });
  });
  function preview() { $('[data-sig-preview]').textContent = el.typedSignature.value; }
  el.typedSignature.addEventListener('input', preview);

  // The signature sent to Properfy: dark ink on a transparent background,
  // so it prints clearly on the white PDF.
  function signatureImage() {
    var out = d.createElement('canvas');
    var o = out.getContext('2d');
    if (mode === 'type') {
      var text = el.typedSignature.value.trim();
      if (text.length < 2) return null;
      out.width = 900; out.height = 220;
      o.fillStyle = '#171b40';
      o.font = 'italic 92px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
      o.textBaseline = 'middle';
      o.fillText(text, 20, 112, 860);
      return out.toDataURL('image/png');
    }
    var pts = [].concat.apply([], strokes);
    if (pts.length < 8) return null;
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs) - 8, minY = Math.min.apply(null, ys) - 8;
    var wv = Math.max.apply(null, xs) - minX + 8, hv = Math.max.apply(null, ys) - minY + 8;
    var scale = 3;
    out.width = Math.round(wv * scale); out.height = Math.round(hv * scale);
    strokes.forEach(function (s) { drawStroke(o, s.map(function (p) { return [p[0] - minX, p[1] - minY]; }), '#171b40', scale); });
    return out.toDataURL('image/png');
  }

  /* ── Submit ───────────────────────────────────────────────────────── */

  function showErr(msg, field) {
    $$('[aria-invalid]', root).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    if (!msg) { errBox.hidden = true; return; }
    errBox.querySelector('span').textContent = msg;
    errBox.hidden = false;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      if (field.focus) field.focus({ preventScroll: true });
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  function busy(on, label) {
    submitBtn.disabled = on;
    if (on) { submitBtn.setAttribute('data-label', submitBtn.innerHTML); submitBtn.textContent = label; }
    else if (submitBtn.getAttribute('data-label')) submitBtn.innerHTML = submitBtn.getAttribute('data-label');
  }
  function api(path, body) {
    return fetch(API + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.field = j.field; throw e; } return j; }); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('');
    var tx = selected();
    if (!tx) return showErr('Please choose your transaction.', form.querySelector('input[name="transaction"]').closest('fieldset'));
    var name = el.name.value.trim();
    if (name.length < 2) return showErr('Please add your full name.', el.name);
    if (!(PF.validEmail ? PF.validEmail(el.email.value) : /\S+@\S+\.\S+/.test(el.email.value))) return showErr('That email doesn’t look quite right.', el.email);
    var area = PF.checkPostcode(el.postcode.value);
    if (!area.ok) return showErr(area.message, el.postcode);
    if (!el.accept.checked) return showErr('Please tick the box to accept the agreement.', el.accept.closest('label'));
    var sig = signatureImage();
    if (!sig) return showErr(mode === 'type' ? 'Please type your name to sign.' : 'Please draw your signature in the box.', mode === 'type' ? el.typedSignature : pad);
    if (!API) return showErr('Online sign-up isn’t open yet. Please call us on ' + ((CFG.contact || {}).phone || '020 3475 2007') + '.');
    var method = payMethod();
    busy(true, method === 'card' ? 'Signing and opening secure checkout…' : 'Signing your agreement…');
    api('/api/onboarding', {
      transaction: tx.id, name: name, email: el.email.value.trim(), postcode: area.postcode,
      agreementVersion: agreementVersion, acceptAgreement: true, earlyStart: el.earlyStart.checked,
      signature: { method: mode === 'type' ? 'typed' : 'drawn', image: sig, typedName: mode === 'type' ? el.typedSignature.value.trim() : undefined },
      paymentMethod: method, website: el.website.value
    }).then(function (res) {
      try { w.sessionStorage.setItem('pfy-onboarding', JSON.stringify({ id: res.id, t: res.token })); } catch (err) { /* private mode */ }
      if (w.dataLayer) w.dataLayer.push({ event: 'onboarding_signed', is_lead: true, transaction: tx.id, payment: method });
      if (res.checkoutUrl) { w.location.href = res.checkoutUrl; return; }
      busy(false);
      // A reload now shows this thank-you again instead of a blank form.
      w.history.replaceState(null, '', w.location.pathname + '?done=1');
      showDone(res, { id: res.id, t: res.token }, res.checkoutError ? 'retry' : null, res.checkoutError);
    }).catch(function (err) {
      busy(false);
      var field = err.field && ({ transaction: form.querySelector('fieldset'), name: el.name, email: el.email, postcode: el.postcode, accept: el.accept.closest('label'), signature: pad }[err.field]);
      showErr(err.message === 'Failed to fetch' ? 'We couldn’t reach our server. Check your connection and try again.' : err.message, field);
    });
  });

  /* ── After signing: thank-you, bank details, or retry payment ─────── */

  function showDone(s, auth, state, note) {
    root.hidden = true;
    var crumbs = $('.crumbs'); if (crumbs) crumbs.hidden = true;
    var hero = root.previousElementSibling; if (hero) hero.hidden = true;
    done.hidden = false;
    var paid = s.paymentStatus === 'paid';
    var bank = s.paymentMethod === 'bank' && !paid;
    var title = 'Thank you, ' + s.firstName + '.';
    var lead;
    if (paid) lead = 'We’ve received your initial payment of ' + s.amount + ' for your ' + s.transaction.toLowerCase() + '. We’re delighted to be part of your property journey.';
    else if (state === 'confirming') lead = 'Your agreement is signed. We’re just confirming your card payment with Stripe. This usually takes a few seconds.';
    else if (state === 'retry') lead = (note ? note + ' ' : '') + 'Your agreement is signed, but your initial payment of ' + s.amount + ' hasn’t been completed yet.';
    else if (bank) lead = 'Your agreement is signed. Please pay ' + s.amount + ' by bank transfer using the details below.';
    else lead = 'Your agreement is signed.';
    $('[data-done-title]').textContent = title;
    $('[data-done-lead]').textContent = lead;
    $('[data-done-ref]').textContent = s.id;
    var bankBox = $('[data-done-bank]');
    bankBox.hidden = !(bank && s.bank);
    if (s.bank) Object.keys(s.bank).forEach(function (k) { var x = bankBox.querySelector('[data-bank="' + k + '"]'); if (x) x.textContent = s.bank[k]; });
    $('[data-done-retry]').hidden = state !== 'retry';
    $('[data-done-emailed] span').textContent = s.agreementEmailed
      ? 'A copy of your signed agreement has been emailed to ' + s.email + '.'
      : 'We’ll email a copy of your signed agreement to ' + s.email + '.';
    done.setAttribute('data-auth', JSON.stringify(auth));
    w.scrollTo({ top: 0 });
    done.focus({ preventScroll: true });
  }

  function retry(path) {
    var auth = JSON.parse(done.getAttribute('data-auth') || '{}');
    return api('/api/onboarding/' + auth.id + path, { token: auth.t });
  }
  $('[data-retry-card]').addEventListener('click', function (e) {
    e.currentTarget.disabled = true;
    retry('/checkout').then(function (res) { if (res.checkoutUrl) w.location.href = res.checkoutUrl; else showDone(res, JSON.parse(done.getAttribute('data-auth'))); })
      .catch(function (err) { e.currentTarget.disabled = false; $('[data-done-lead]').textContent = err.message; });
  });
  $('[data-retry-bank]').addEventListener('click', function (e) {
    e.currentTarget.disabled = true;
    retry('/bank').then(function (res) { showDone(res, JSON.parse(done.getAttribute('data-auth'))); })
      .catch(function (err) { e.currentTarget.disabled = false; $('[data-done-lead]').textContent = err.message; });
  });

  // Back from Stripe (?id=…&t=…&paid=1 or &cancelled=1), or a reload after
  // signing (?done=1). The private link is kept in this tab's session, not
  // in the address bar or browser history.
  function resume() {
    var back = ['paid', 'cancelled', 'done'].filter(function (k) { return params.get(k); })[0];
    var saved = {};
    try { saved = JSON.parse(w.sessionStorage.getItem('pfy-onboarding')) || {}; } catch (err) { /* private mode */ }
    var id = params.get('id') || saved.id, t = params.get('t') || saved.t;
    if (params.get('id')) {
      try { w.sessionStorage.setItem('pfy-onboarding', JSON.stringify({ id: id, t: t })); } catch (err) { /* private mode */ }
      w.history.replaceState(null, '', w.location.pathname + (back ? '?' + back + '=1' : ''));
    }
    if (!back || !id || !t || !API) return;
    var auth = { id: id, t: t };
    var tries = 0;
    function check() {
      api('/api/onboarding/' + encodeURIComponent(id) + '?token=' + encodeURIComponent(t)).then(function (s) {
        if (s.paymentStatus === 'paid' || s.paymentMethod === 'bank') return showDone(s, auth);
        if (back !== 'paid') return showDone(s, auth, 'retry');
        if (tries++ < 10) { showDone(s, auth, 'confirming'); w.setTimeout(check, 2000); return; }
        showDone(s, auth, 'confirming');
        $('[data-done-lead]').textContent = 'Your agreement is signed. We haven’t had confirmation of your card payment from Stripe yet. We’ll email you as soon as it arrives, or call us on ' + ((CFG.contact || {}).phone || '020 3475 2007') + ' if you have any questions.';
      }).catch(function () { /* show the form */ });
    }
    check();
  }

  // Until the onboarding API is connected (PFY.config.onboardingApi), say so up front.
  if (!API && !$('.gs-draft:not([data-gs-closed])')) $('[data-gs-closed]').hidden = false;

  refresh();
  resume();
})(window, document);
