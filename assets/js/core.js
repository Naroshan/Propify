/*
  Properfy — shared behaviour
  Icons, the "Start your move" / "My move" nav button, the saved move,
  lead sending, England and Wales checks and toasts.
*/
(function (w, d) {
  'use strict';

  var PF = (w.PF = w.PF || {});

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  PF.$ = function (sel, ctx) { return (ctx || d).querySelector(sel); };
  PF.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); };

  PF.esc = function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  PF.params = function () {
    var out = {};
    new URLSearchParams(w.location.search).forEach(function (v, k) { out[k] = v; });
    return out;
  };

  PF.store = {
    get: function (key) { try { return JSON.parse(w.localStorage.getItem(key)); } catch (e) { return null; } },
    set: function (key, value) { try { w.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
    remove: function (key) { try { w.localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  PF.getMove = function () { return PF.store.get(PF.config.storageKey); };
  PF.saveMove = function (move) { return PF.store.set(PF.config.storageKey, move); };

  PF.hydrate = function (ctx) {
    PF.$$('[data-icon]', ctx).forEach(function (el) {
      var svg = PF.icon(el.getAttribute('data-icon'));
      if (el.tagName === 'I') el.outerHTML = svg;
      else { el.insertAdjacentHTML('afterbegin', svg); el.removeAttribute('data-icon'); }
    });
  };

  PF.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  PF.makeRef = function () {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var buf = new Uint8Array(6);
    w.crypto.getRandomValues(buf);
    var out = '';
    for (var i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    return 'PRF-' + out;
  };

  /* ── England and Wales only ───────────────────────────────────────────── */

  // Returns { ok, postcode } or { ok: false, message } ready to show.
  PF.checkPostcode = function (raw) {
    var area = PF.config.serviceArea;
    var pc = String(raw || '').toUpperCase().replace(/\s+/g, '');
    var m = pc.match(/^([A-Z]{1,2})(\d[A-Z\d]?)(\d[A-Z]{2})$/);
    if (!m) return { ok: false, message: 'Add the full postcode, for example E8 3AB.' };
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

  PF.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };

  /* ── Leads ────────────────────────────────────────────────────────────── */

  var TEAM_CHOICE = { have: 'Has their own', intro: 'Wants an introduction' };

  // One labelled row per field, so each lead arrives as a readable email.
  // "email" becomes the reply-to address.
  PF.leadFields = function (type, p) {
    var f = { _template: 'table', _captcha: 'false' };
    if (p._honey) f._honey = p._honey;
    var j = PF.journeys[p.journey];

    if (type === 'move') {
      f._subject = 'New Properfy move: ' + (j ? j.label : p.journey) + ' - ' + p.name + ' (' + p.postcode + ')';
      f['Reference'] = p.ref;
      f['Name'] = p.name;
      f.email = p.email;
      f['Phone'] = p.phone || 'Not given';
      f['Move'] = j ? j.label : p.journey;
      f['Address'] = p.address;
      f['Postcode'] = p.postcode;
      f[j ? j.price.replace(' (£)', '') : 'Price'] = p.price ? '£' + p.price : 'Not given';
      Object.keys(PF.roles).forEach(function (k) { f[PF.roles[k].label] = TEAM_CHOICE[p.team[k]]; });
      f['Consent to share with introduced partners'] = 'Yes (' + new Date().toLocaleString('en-GB') + ')';
      f['Sent from'] = w.location.href;
    } else if (type === 'arrange') {
      f._subject = 'Properfy: arrange ' + p.service.toLowerCase() + ' for ' + p.name + ' (' + p.ref + ')';
      f['Reference'] = p.ref;
      f['Service'] = p.service;
      f['Step'] = p.step;
      f['Name'] = p.name;
      f.email = p.email;
      f['Phone'] = p.phone || 'Not given';
      f['Move'] = j ? j.label : p.journey;
      f['Address'] = p.address;
      f['Postcode'] = p.postcode;
    } else if (type === 'partner') {
      f._subject = 'Properfy partner enquiry: ' + p.name + ', ' + p.firm;
      f['Name'] = p.name;
      f.email = p.email;
      f['Phone'] = p.phone || 'Not given';
      f['Firm'] = p.firm;
      f['Role'] = p.role;
      f['Office postcode'] = p.postcode;
      f['Message'] = p.message || '—';
    }
    return f;
  };

  // Resolves { sent: false } in preview mode (no endpoint) so pages can say
  // so honestly; rejects when the service reports a failure.
  PF.send = function (type, payload) {
    var url = PF.config.leadEndpoint;
    var fields = PF.leadFields(type, payload);
    if (!url) {
      if (w.console) console.info('[Properfy preview] ' + type + ' not sent — set PF.config.leadEndpoint', fields);
      return Promise.resolve({ sent: false });
    }
    var ctrl = w.AbortController ? new AbortController() : null;
    var timer = ctrl ? w.setTimeout(function () { ctrl.abort(); }, 20000) : null;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(fields),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.success === false || data.success === 'false') {
          throw new Error(data.message || 'Request failed: ' + res.status);
        }
        return { sent: true };
      });
    }).finally(function () {
      if (timer) w.clearTimeout(timer);
    });
  };

  /* ── Toast ────────────────────────────────────────────────────────────── */

  var toastEl, toastTimer;
  PF.toast = function (msg) {
    if (!toastEl) {
      toastEl = d.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      d.body.appendChild(toastEl);
    }
    toastEl.innerHTML = PF.icon('check-circle-fill') + '<span>' + PF.esc(msg) + '</span>';
    w.clearTimeout(toastTimer);
    w.requestAnimationFrame(function () { toastEl.classList.add('on'); });
    toastTimer = w.setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };

  /* ── Page setup ───────────────────────────────────────────────────────── */

  PF.hydrate();

  // Once a move is saved, the nav button takes people back to it.
  if (PF.getMove()) {
    PF.$$('[data-move-cta]').forEach(function (a) {
      a.href = 'move.html';
      a.className = a.className.replace('btn-primary', 'btn-secondary');
      a.innerHTML = PF.icon('house-line') + 'My move';
    });
  }

  PF.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})(window, document);
