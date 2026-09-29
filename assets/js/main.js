/*
  Properfy — shared behaviour
  Header state, overlay menu, scroll reveals, intro loader, preview cards,
  contact form and small helpers used by the page scripts.
*/
(function (w, d) {
  'use strict';

  var PF = (w.PF = w.PF || {});
  var root = d.documentElement;
  var body = d.body;
  var reduceMotion = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    get: function (key) {
      try { return JSON.parse(w.localStorage.getItem(key)); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { w.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { w.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  PF.reduceMotion = reduceMotion;

  // Turns a lead into labelled fields, so it arrives as a readable email
  // (FormSubmit renders one row per field). "email" is used as the reply-to.
  PF.leadFields = function (type, p) {
    var f = { _template: 'table', _captcha: 'false' };
    if (p._honey) f._honey = p._honey;
    var serviceName = function (id) { var s = PF.service(id); return s ? (s.single || s.name) : id; };

    if (type === 'plan') {
      var goal = PF.goal(p.goal);
      var c = p.contact || {};
      f._subject = 'New Properfy plan: ' + (goal ? goal.short : p.goal) + ' - ' + c.name + ' (' + p.ref + ')';
      f['Reference'] = p.ref;
      f['Name'] = c.name;
      f.email = c.email;
      f['Phone'] = c.phone || 'Not given';
      f['Best way to reach them'] = c.preferred === 'phone' ? 'Phone' : 'Email';
      f['Property postcode or town'] = c.postcode || 'Not given';
      f["What they're doing"] = goal ? goal.label : p.goal;
      f['Services requested'] = p.services.map(function (s, i) {
        return (i + 1) + '. ' + serviceName(s.id) + ' (' + s.when + ')';
      }).join('; ');
      f['Their answers'] = p.answers.map(function (a) { return a.question + ' ' + a.answer; }).join('; ') || 'None';
      f['Tell them when live'] = (p.notify || []).map(serviceName).join(', ') || 'None';
      f['Consent to share with specialists'] = 'Yes (' + new Date(p.consent.at).toLocaleString('en-GB') + ')';
      f['Marketing emails'] = p.consent.marketing ? 'Yes' : 'No';
      f['Sent from'] = p.source;
    } else if (type === 'contact') {
      var topic = PF.goal(p.topic);
      f._subject = 'New Properfy enquiry from ' + p.name;
      f['Name'] = p.name;
      f.email = p.email;
      f["What they're doing"] = topic ? topic.label : p.topic;
      f['Message'] = p.message;
    } else if (type === 'notify') {
      f._subject = 'Properfy: notify me about ' + serviceName(p.service);
      f.email = p.email;
      f['Service'] = serviceName(p.service);
    }
    return f;
  };

  // Sends a lead to PF.config.leadEndpoint. Resolves { sent: false } in
  // preview mode (no endpoint) so the UI can say so honestly, and rejects if
  // the service reports a failure, so the form can ask the customer to retry.
  PF.send = function (type, payload) {
    var url = PF.config && PF.config.leadEndpoint;
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

  PF.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };

  // <i data-icon="arrow"> is replaced by the icon; other elements get it inside.
  // <span data-mark> becomes the brand mark.
  PF.hydrate = function (ctx) {
    PF.$$('[data-icon]', ctx).forEach(function (el) {
      var svg = PF.icon(el.getAttribute('data-icon'));
      if (el.tagName === 'I') el.outerHTML = svg;
      else { el.innerHTML = svg; el.removeAttribute('data-icon'); }
    });
    PF.$$('[data-mark]', ctx).forEach(function (el) { el.outerHTML = PF.mark(); });
  };
  PF.hydrate();

  /* ── Preview cards (product UI instead of stock photos) ───────────────── */

  function nextMoveDate() {
    var dt = new Date();
    dt.setDate(dt.getDate() + 42);
    while (dt.getDay() !== 5) dt.setDate(dt.getDate() + 1); // a Friday, naturally
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
  }

  PF.previewCard = function (s, extraClass) {
    var p = s && s.preview;
    if (!p) return '';
    var icon = PF.icon;
    var rows = p.rows.map(function (r) {
      return (
        '<li class="pv-row is-' + r.state + '">' +
        '<span class="pv-dot">' + (r.state === 'done' ? icon('check') : '') + '</span>' +
        '<span class="pv-label">' + r.label + (r.badge ? '<em class="pv-badge">' + r.badge + '</em>' : '') + '</span>' +
        '<span class="pv-val">' + (r.value || '') + '</span>' +
        '</li>'
      );
    }).join('');

    return (
      '<div class="pv' + (extraClass ? ' ' + extraClass : '') + '" aria-hidden="true">' +
      '<div class="pv-head"><span class="pv-icon">' + icon(s.icon) + '</span>' +
      '<div><strong>' + p.title + '</strong><small>' + p.meta.replace('{moveDate}', nextMoveDate()) + '</small></div>' +
      (p.chip ? '<span class="pv-chip">' + p.chip + '</span>' : '') +
      '</div>' +
      (p.countdown ? '<div class="pv-countdown" data-countdown></div>' : '') +
      (p.progress != null ? '<div class="pv-progress"><span style="--p:' + p.progress + '"></span></div>' : '') +
      '<ul class="pv-rows">' + rows + '</ul>' +
      (p.foot ? '<div class="pv-foot">' + icon('shield') + '<span>' + p.foot + '</span></div>' : '') +
      '</div>'
    );
  };

  // Auction countdowns tick towards the next Thursday, 11am.
  function nextAuction() {
    var t = new Date();
    t.setHours(11, 0, 0, 0);
    t.setDate(t.getDate() + 2);
    while (t.getDay() !== 4) t.setDate(t.getDate() + 1);
    return t;
  }
  var auctionAt = nextAuction();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var els = PF.$$('[data-countdown]');
    if (!els.length) return;
    var diff = Math.max(0, auctionAt - new Date());
    var s = Math.floor(diff / 1000);
    var parts = [
      [Math.floor(s / 86400), 'days'],
      [pad(Math.floor((s % 86400) / 3600)), 'hrs'],
      [pad(Math.floor((s % 3600) / 60)), 'mins'],
      [pad(s % 60), 'secs']
    ];
    var html = parts.map(function (p) { return '<div><b>' + p[0] + '</b><small>' + p[1] + '</small></div>'; }).join('');
    els.forEach(function (el) { el.innerHTML = html; });
  }
  PF.startCountdowns = function () {
    tick();
    if (!PF._countdown) PF._countdown = w.setInterval(tick, 1000);
  };

  /* ── Header ───────────────────────────────────────────────────────────── */

  var header = PF.$('#header');
  if (header && header.hasAttribute('data-alt')) {
    var onScroll = function () {
      header.classList.toggle('alt', w.scrollY < 24 && !body.classList.contains('is-menu-visible'));
    };
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // "Your plan" shortcut when a plan is saved on this device.
  var saved = PF.store.get(PF.config && PF.config.storageKey);
  if (saved && saved.ref) {
    PF.$$('.nav-resume').forEach(function (el) { el.hidden = false; });
  }

  /* ── Menu (overlay) ───────────────────────────────────────────────────── */

  var menu = PF.$('#menu');
  var lastFocus = null;

  function openMenu() {
    if (!menu) return;
    lastFocus = d.activeElement;
    body.classList.add('is-menu-visible');
    menu.setAttribute('aria-hidden', 'false');
    PF.$$('.menu-toggle').forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    if (header) header.classList.remove('alt');
    w.setTimeout(function () {
      var first = PF.$('a, button', menu.querySelector('.inner'));
      if (first) first.focus();
    }, 50);
  }

  function closeMenu(restoreFocus) {
    if (!menu || !body.classList.contains('is-menu-visible')) return;
    body.classList.remove('is-menu-visible');
    menu.setAttribute('aria-hidden', 'true');
    PF.$$('.menu-toggle').forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    w.dispatchEvent(new Event('scroll'));
    if (restoreFocus !== false && lastFocus) lastFocus.focus();
  }

  if (menu) {
    // Services list is generated from the registry, so new services appear automatically.
    var list = PF.$('[data-menu-services]', menu);
    if (list && PF.liveServices) {
      list.innerHTML = PF.liveServices().map(function (s) {
        return '<li><a href="service.html?s=' + s.id + '">' + PF.icon(s.icon) + '<span>' + (s.single || s.name) + '</span></a></li>';
      }).join('');
    }

    d.addEventListener('click', function (e) {
      var toggle = e.target.closest('.menu-toggle');
      if (toggle) {
        e.preventDefault();
        body.classList.contains('is-menu-visible') ? closeMenu() : openMenu();
        return;
      }
      if (!body.classList.contains('is-menu-visible')) return;
      if (e.target.closest('#menu .close')) {
        e.preventDefault();
        closeMenu();
        return;
      }
      var link = e.target.closest('#menu a[href]');
      if (link) {
        var href = link.getAttribute('href');
        var here = w.location.pathname.split('/').pop() || 'index.html';
        var samePageHash = href.charAt(0) === '#' || (href.indexOf('#') > 0 && href.split('#')[0] === here);
        closeMenu(false);
        if (samePageHash) return; // let the browser scroll
        e.preventDefault();
        w.setTimeout(function () { w.location.href = href; }, 250);
        return;
      }
      if (!e.target.closest('#menu .inner')) closeMenu();
    });

    d.addEventListener('keydown', function (e) {
      if (!body.classList.contains('is-menu-visible')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = PF.$$('a[href], button:not([disabled])', menu.querySelector('.inner'));
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── Scroll reveal ────────────────────────────────────────────────────── */

  PF.observeReveals = function (ctx) {
    var els = PF.$$('[data-reveal]:not(.is-in), .steps:not(.is-in)', ctx);
    if (!('IntersectionObserver' in w) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!PF._io) {
      PF._io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            PF._io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach(function (el) { PF._io.observe(el); });
  };

  /* ── Contact form (footer) ────────────────────────────────────────────── */

  PF.$$('form[data-contact]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
      var ok = true;
      [name, email, msg].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      PF.$$('.field-error', form).forEach(function (el) { el.remove(); });
      function fail(el, text) {
        ok = false;
        el.setAttribute('aria-invalid', 'true');
        el.insertAdjacentHTML('afterend', '<p class="field-error">' + text + '</p>');
      }
      if (!name.value.trim()) fail(name, 'Please tell us your name.');
      if (!PF.validEmail(email.value)) fail(email, 'Please enter a valid email address.');
      if (!msg.value.trim()) fail(msg, 'Let us know how we can help.');
      if (!ok) { PF.$('[aria-invalid="true"]', form).focus(); return; }

      var btn = PF.$('[type="submit"]', form);
      btn.disabled = true;
      var payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        topic: form.elements.topic ? form.elements.topic.value : '',
        message: msg.value.trim(),
        _honey: form.elements._honey ? form.elements._honey.value : ''
      };
      PF.send('contact', payload).then(function (res) {
        form.innerHTML =
          '<div class="form-success" role="status">' + PF.icon('check') + '<p><strong>Thanks, ' + PF.esc(payload.name.split(' ')[0]) + '.</strong>' +
          (res.sent
            ? 'A real person will reply by email within one working day.'
            : 'Preview mode: this message wasn’t sent. Email us at <a class="inline" href="mailto:' + PF.config.contact.email + '">' + PF.config.contact.email + '</a> instead.') +
          '</p></div>';
      }).catch(function () {
        btn.disabled = false;
        btn.insertAdjacentHTML('afterend', '<p class="field-error">Something went wrong sending that. Please try again, or email us.</p>');
      });
    });
  });

  PF.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── Intro loader: "property" → "properfy" ────────────────────────────── */

  function reveal() {
    w.setTimeout(function () { body.classList.remove('is-preload'); }, 60);
  }

  var loader = PF.$('.loader');
  if (loader && root.classList.contains('intro')) {
    try { w.sessionStorage.setItem('pf.intro', '1'); } catch (e) { /* ignore */ }
    var mark = PF.$('.wordmark', loader);
    w.setTimeout(function () {
      mark.classList.remove('is-t');
      loader.classList.add('is-morphed');
    }, 450);
    w.setTimeout(function () {
      loader.classList.add('is-done');
      reveal();
    }, 1500);
    w.setTimeout(function () {
      root.classList.remove('intro');
    }, 2100);
  } else {
    if (d.readyState === 'complete') reveal();
    else w.addEventListener('load', reveal);
    // Don't hold the page hostage to a slow asset.
    w.setTimeout(reveal, 1200);
  }

  // Page scripts call PF.ready(fn) — runs once shared setup is done.
  PF.ready = function (fn) { fn(); PF.observeReveals(); PF.startCountdowns(); };

  PF.observeReveals();
  PF.startCountdowns();
})(window, document);
