/*
  Properfy — service page (service.html?s=<id>)
  Every service page is generated from its registry entry: plain-English
  explanation, the journey step by step, guide price, partner standards,
  FAQs and related services. Coming-soon services get a notify page, and
  no id shows the full service directory.
*/
(function (w, d) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;
  var main = PF.$('[data-service-page]');
  if (!main) return;

  var BG = '<div class="banner-bg" aria-hidden="true"><span class="glow g1"></span><span class="glow g2"></span><span class="grid-lines"></span></div>';

  PF.ready(function () {
    var id = PF.params().s;
    var s = id && PF.service(id);

    if (s && s.status === 'live') renderLive(s);
    else if (s) renderSoon(s);
    else renderDirectory();

    PF.$$('#wrapper > .wrapper', main).forEach(function (el, i) {
      el.classList.toggle('alt', i % 2 === 1);
    });
    PF.hydrate(main);
    PF.observeReveals(main);
    PF.startCountdowns();
    main.removeAttribute('aria-busy');
  });

  function setMeta(title, description) {
    d.title = title + ' — Properfy';
    var m = PF.$('meta[name="description"]');
    if (m && description) m.setAttribute('content', description);
  }

  function relatedCards(ids, cls) {
    return '<ul class="related' + (cls ? ' ' + cls : '') + '">' + ids.map(function (rid, i) {
      var r = PF.service(rid);
      if (!r) return '';
      return (
        '<li data-reveal style="--d:' + i * 0.08 + 's"><a href="service.html?s=' + r.id + '">' +
        '<span class="fi">' + icon(r.icon) + '</span>' +
        '<strong>' + r.name + '</strong><span>' + (r.blurb || r.short) + '</span>' +
        '<span class="go">' + (r.status === 'live' ? 'Explore ' + r.name.toLowerCase() : 'Get notified') + icon('arrow') + '</span>' +
        '</a></li>'
      );
    }).join('') + '</ul>';
  }

  function ctaBand(title, text, href, label) {
    return (
      '<section class="wrapper coral" id="cta"><div class="inner" data-reveal>' +
      '<h2>' + title + '</h2><p class="lead">' + text + '</p>' +
      '<div class="actions"><a class="btn btn-dark btn-lg" href="' + href + '">' + label + icon('arrow') + '</a>' +
      '<a class="btn btn-lg" href="#contact">Talk to a person</a></div>' +
      '</div></section>'
    );
  }

  /* ── Live service ─────────────────────────────────────────────────────── */

  function renderLive(s) {
    setMeta(s.name, s.blurb);
    var start = 'start.html?service=' + s.id;

    var banner =
      '<section id="banner" class="banner banner-service">' + BG +
      '<div class="inner"><div class="banner-inner">' +
      '<div class="banner-copy">' +
      '<p class="pill">' + icon(s.icon) + s.name + '</p>' +
      '<h1 class="hero-title">' + s.tagline + '</h1>' +
      '<p class="lead hero-sub">' + s.blurb + '</p>' +
      '<div class="actions"><a class="btn btn-primary btn-lg" href="' + start + '">' + s.cta + icon('arrow') + '</a>' +
      '<a class="btn btn-lg" href="#journey">How it works</a></div>' +
      '<dl class="facts">' +
      '<div><dt>Guide price</dt><dd>' + s.price.label + '</dd></div>' +
      '<div><dt>Timescale</dt><dd>' + s.duration + '</dd></div>' +
      '<div><dt>Specialists</dt><dd>' + s.credential + '</dd></div>' +
      '</dl>' +
      (s.risk ? '<p class="risk">' + s.risk + '</p>' : '') +
      '</div>' +
      '<div class="banner-card spot-visual">' + PF.previewCard(s, 'flat') + '</div>' +
      '</div></div>' +
      '</section>';

    var plain =
      '<section class="wrapper" id="plain"><div class="inner">' +
      '<div class="plain-grid">' +
      '<div data-reveal><p class="eyebrow">In plain English</p>' +
      '<h2>' + (s.whatIs || 'What is ' + s.name.toLowerCase() + '?') + '</h2>' +
      '<p class="lead">' + s.plain + '</p></div>' +
      '<div data-reveal style="--d:.1s">' +
      '<p class="label">What’s included</p>' +
      '<ul class="inc-list yes">' + s.included.map(function (x) { return '<li>' + icon('check') + '<span>' + x + '</span></li>'; }).join('') + '</ul>' +
      '<p class="label">Paid separately</p>' +
      '<ul class="inc-list no">' + s.excluded.map(function (x) { return '<li>' + icon('minus') + '<span>' + x + '</span></li>'; }).join('') + '</ul>' +
      '</div></div>' +
      (s.levels
        ? '<div class="levels">' + s.levels.map(function (l, i) {
            return (
              '<div class="level' + (l.pick ? ' pick' : '') + '" data-reveal style="--d:' + i * 0.08 + 's">' +
              (l.pick ? '<span class="ribbon">Most popular</span>' : '') +
              '<span class="tag">' + l.name + '</span><h3>' + l.title + '</h3><p>' + l.fit + '</p>' +
              '<span class="amt">' + l.price + '</span></div>'
            );
          }).join('') + '</div>'
        : '') +
      '</div></section>';

    var journey =
      '<section class="wrapper spot1" id="journey"><div class="inner">' +
      '<div class="section-head" data-reveal><p class="eyebrow">Your journey</p><h2>What happens, step by step.</h2>' +
      '<p class="lead">No surprises. Here’s exactly what to expect — and when.</p></div>' +
      '<ol class="journey">' + s.steps.map(function (st, i) {
        return (
          '<li data-reveal style="--d:' + i * 0.08 + 's"><span class="jn">' + (i + 1) + '</span>' +
          '<h3>' + st.title + '</h3><p>' + st.text + '</p>' +
          '<span class="jt">' + icon('clock') + st.time + '</span></li>'
        );
      }).join('') + '</ol>' +
      '</div></section>';

    var partners = s.partners && s.partners.length
      ? '<p class="label" style="margin-top:2rem">Our ' + s.name.toLowerCase() + ' partners</p><ul class="standards">' +
        s.partners.map(function (p) {
          return '<li>' + icon('shield') + '<span>' + esc(p.name) + (p.regulator ? '<br><small class="faint">' + esc(p.regulator) + '</small>' : '') + '</span></li>';
        }).join('') + '</ul>'
      : '';

    var cost =
      '<section class="wrapper" id="cost"><div class="inner"><div class="cost-grid">' +
      '<div class="price-box" data-reveal><p class="eyebrow">What it costs</p>' +
      '<span class="big">' + s.price.long + '</span><p>' + s.price.note + '</p>' +
      '<a class="btn btn-primary btn-block" href="' + start + '">' + s.cta + icon('arrow') + '</a></div>' +
      '<div data-reveal style="--d:.1s"><p class="eyebrow">Who you’ll work with</p>' +
      '<h2>Checked, regulated specialists.</h2>' +
      '<ul class="standards">' + s.standards.map(function (x) { return '<li>' + icon('shield') + '<span>' + x + '</span></li>'; }).join('') + '</ul>' +
      '<p class="label">Before you commit, you’ll see</p>' +
      '<ul class="see-list">' +
      '<li>' + icon('user') + 'The firm’s name, and who’ll handle your case</li>' +
      '<li>' + icon('shield') + 'Their regulator and registration number</li>' +
      '<li>' + icon('star') + 'Independent customer reviews</li>' +
      '<li>' + icon('pound') + 'Your fixed price, in writing</li>' +
      '</ul>' + partners +
      '</div></div></div></section>';

    var faq =
      '<section class="wrapper style2" id="faq"><div class="inner">' +
      '<div class="faq-grid">' +
      '<div class="section-head" data-reveal><p class="eyebrow">Questions</p><h2>' + s.name + ', answered.</h2>' +
      '<p class="lead">Still unsure? <a class="inline" href="#contact">Ask a real person</a> — no jargon, no hard sell.</p></div>' +
      '<div data-reveal>' + s.faqs.map(function (f) {
        return '<details class="qa"><summary>' + f.q + '<span class="pm">' + icon('plus') + '</span></summary><div class="qa-body"><p>' + f.a + '</p></div></details>';
      }).join('') + '</div>' +
      '</div></div></section>';

    var related =
      '<section class="wrapper" id="related"><div class="inner">' +
      '<div class="section-head" data-reveal><p class="eyebrow">One plan, not ten companies</p><h2>Often paired with ' + (s.noun || s.name.toLowerCase()) + '.</h2></div>' +
      relatedCards(s.related) +
      '</div></section>';

    main.innerHTML =
      banner +
      '<div id="wrapper">' + plain + journey + cost + faq + related +
      ctaBand('Ready when you are.', 'Get ' + (s.noun || s.name.toLowerCase()) + ' sorted — alongside everything else your move needs.', start, s.cta) +
      '</div>';
  }

  /* ── Coming-soon service ──────────────────────────────────────────────── */

  function renderSoon(s) {
    setMeta(s.name + ' (coming soon)', s.short);
    var saved = PF.store.get(PF.config.notifyKey) || [];
    var on = saved.indexOf(s.id) !== -1;

    main.innerHTML =
      '<section id="banner" class="banner banner-service">' + BG +
      '<div class="inner"><div class="banner-copy" style="max-width:44rem">' +
      '<p class="pill">' + icon(s.icon) + 'Coming soon</p>' +
      '<h1 class="hero-title">' + s.name + '.</h1>' +
      '<p class="lead hero-sub">' + s.short + ' We’re building it into Properfy so it slots straight into your plan.</p>' +
      (on
        ? '<div class="form-success" role="status">' + icon('check') + '<p><strong>You’re on the list.</strong>We’ll let you know when it launches.</p></div>'
        : '<form class="notify-form" data-notify-form novalidate>' +
          '<label class="sr-only" for="n-email">Email address</label>' +
          '<input type="email" id="n-email" name="email" placeholder="you@example.com" autocomplete="email">' +
          '<div class="hp" aria-hidden="true"><label for="n-hp">Leave this empty</label><input type="text" id="n-hp" name="_honey" tabindex="-1" autocomplete="off"></div>' +
          '<button class="btn btn-primary" type="submit">' + icon('bell') + 'Notify me</button>' +
          '</form>') +
      '</div></div>' +
      '</section>' +
      '<div id="wrapper">' +
      '<section class="wrapper" id="available"><div class="inner">' +
      '<div class="section-head" data-reveal><p class="eyebrow">Available today</p><h2>Everything else, already sorted.</h2></div>' +
      relatedCards(PF.liveServices().map(function (x) { return x.id; }).slice(0, 3)) +
      '</div></section>' +
      ctaBand('Start with what you’re doing.', 'Buying, selling, moving, remortgaging or investing — we’ll build your plan.', 'start.html', 'Get started') +
      '</div>';

    var form = PF.$('[data-notify-form]', main);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.elements.email;
      PF.$$('.field-error', form.parentNode).forEach(function (x) { x.remove(); });
      if (!PF.validEmail(input.value)) {
        input.setAttribute('aria-invalid', 'true');
        form.insertAdjacentHTML('afterend', '<p class="field-error">Please enter a valid email address.</p>');
        input.focus();
        return;
      }
      var list = PF.store.get(PF.config.notifyKey) || [];
      if (list.indexOf(s.id) === -1) list.push(s.id);
      PF.store.set(PF.config.notifyKey, list);
      PF.send('notify', { service: s.id, email: input.value.trim(), _honey: form.elements._honey.value }).then(function (res) {
        form.outerHTML = '<div class="form-success" role="status">' + icon('check') + '<p><strong>You’re on the list.</strong>' +
          (res.sent ? 'We’ll email you when it launches.' : 'Preview mode: saved on this device only.') + '</p></div>';
      });
    });
  }

  /* ── Directory ────────────────────────────────────────────────────────── */

  function renderDirectory() {
    setMeta('All services', 'Conveyancing, mortgages, surveys, auctions, removals and more — everything for your property in one place.');
    var live = PF.liveServices();
    var soon = PF.soonServices();

    main.innerHTML =
      '<section id="banner" class="banner banner-service">' + BG +
      '<div class="inner"><div class="banner-copy" style="max-width:46rem">' +
      '<p class="pill">' + PF.mark() + 'All services</p>' +
      '<h1 class="hero-title">Everything for your property.</h1>' +
      '<p class="lead hero-sub">Start with a single service, or tell us what you’re doing and we’ll build the whole plan.</p>' +
      '<div class="actions"><a class="btn btn-primary btn-lg" href="start.html">Build my plan' + icon('arrow') + '</a></div>' +
      '</div></div></section>' +
      '<div id="wrapper">' +
      '<section class="wrapper" id="live"><div class="inner">' +
      '<div class="section-head" data-reveal><p class="eyebrow">Available now</p><h2>The essentials.</h2></div>' +
      relatedCards(live.map(function (x) { return x.id; })) +
      '</div></section>' +
      '<section class="wrapper style2" id="soon"><div class="inner">' +
      '<div class="section-head" data-reveal><p class="eyebrow">Coming to Properfy</p><h2>And everything around them.</h2></div>' +
      relatedCards(soon.map(function (x) { return x.id; }), 'cols-5') +
      '</div></section>' +
      '</div>';
  }
})(window, document);
