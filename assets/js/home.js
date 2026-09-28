/*
  Properfy — homepage
  Concierge card, service spotlights, coming-soon grid and guide pricing,
  all rendered from the registry.
*/
(function (w, d) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;

  var NUMBERS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

  PF.ready(function () {
    var live = PF.liveServices();

    PF.$$('[data-live-count]').forEach(function (el) {
      el.textContent = NUMBERS[live.length] || live.length;
    });

    renderChipNav(live);
    renderSpotlights(live);
    renderSoon();
    renderPricing(live);
    initConcierge();

    var note = PF.$('[data-sample-note]');
    if (note && !PF.config.sampleReviews) note.hidden = true;
  });

  /* ── Service chips ────────────────────────────────────────────────────── */

  function renderChipNav(live) {
    var nav = PF.$('[data-chip-nav]');
    if (!nav) return;
    nav.innerHTML = live.map(function (s) {
      return '<li><a href="#svc-' + s.id + '">' + icon(s.icon) + s.name + '</a></li>';
    }).join('');
  }

  /* ── Spotlights: one angular row per live service ─────────────────────── */

  function renderSpotlights(live) {
    var intro = PF.$('[data-services-intro]');
    if (!intro) return;

    var html = live.map(function (s, i) {
      var n = i + 1;
      var shade = 'spot' + ((i % 5) + 1);
      var classes = ['wrapper', 'spotlight', shade];
      if (i % 2 === 1) classes.push('flip');  // alternate the visual side

      var steps = s.steps.slice(0, 3).map(function (st, j) {
        return '<li><span>' + (j + 1) + '</span>' + st.title + '</li>';
      }).join('');

      return (
        '<section class="' + classes.join(' ') + '" id="svc-' + s.id + '">' +
        '<div class="inner">' +
        '<div class="spot-visual" data-reveal>' + PF.previewCard(s) + '</div>' +
        '<div class="spot-content" data-reveal style="--d:.1s">' +
        '<p class="eyebrow"><span class="num">' + (n < 10 ? '0' + n : n) + '</span>' + icon(s.icon) + s.name + '</p>' +
        '<h2 class="major">' + s.tagline + '</h2>' +
        '<p class="lead">' + s.blurb + '</p>' +
        '<ol class="mini-steps" aria-label="How it works">' + steps + '</ol>' +
        '<dl class="facts">' +
        '<div><dt>Guide price</dt><dd>' + s.price.label + '</dd></div>' +
        '<div><dt>Timescale</dt><dd>' + s.duration + '</dd></div>' +
        '<div><dt>Specialists</dt><dd>' + s.credential + '</dd></div>' +
        '</dl>' +
        '<div class="actions">' +
        '<a class="btn btn-light" href="start.html?service=' + s.id + '">' + s.cta + icon('arrow') + '</a>' +
        '<a class="special" href="service.html?s=' + s.id + '">How it works</a>' +
        '</div>' +
        (s.risk ? '<p class="risk">' + s.risk + '</p>' : '') +
        '</div>' +
        '</div>' +
        '</section>'
      );
    }).join('');

    intro.insertAdjacentHTML('afterend', html);

    // Solid State alternates the direction of each angled edge. With a
    // variable number of services, recompute it for every section.
    PF.$$('#wrapper > .wrapper').forEach(function (el, i) {
      el.classList.toggle('alt', i % 2 === 1);
    });
  }

  /* ── Coming soon ──────────────────────────────────────────────────────── */

  function renderSoon() {
    var list = PF.$('[data-soon]');
    if (!list) return;
    var saved = PF.store.get(PF.config.notifyKey) || [];

    list.innerHTML = PF.soonServices().map(function (s, i) {
      var on = saved.indexOf(s.id) !== -1;
      return (
        '<li class="feature" data-reveal style="--d:' + (i % 4) * 0.06 + 's">' +
        '<div class="feature-top"><span class="fi">' + icon(s.icon) + '</span><span class="tag">Coming soon</span></div>' +
        '<h3>' + s.name + '</h3>' +
        '<p>' + s.short + '</p>' +
        '<button type="button" class="notify' + (on ? ' is-on' : '') + '" data-notify="' + s.id + '" aria-pressed="' + on + '">' +
        notifyLabel(on) + '</button>' +
        '</li>'
      );
    }).join('');

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-notify]');
      if (!btn) return;
      var id = btn.getAttribute('data-notify');
      var list = PF.store.get(PF.config.notifyKey) || [];
      var i = list.indexOf(id);
      if (i === -1) list.push(id); else list.splice(i, 1);
      PF.store.set(PF.config.notifyKey, list);
      var on = i === -1;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on);
      btn.innerHTML = notifyLabel(on);
    });
  }

  function notifyLabel(on) {
    return on ? icon('check') + 'We’ll let you know' : icon('bell') + 'Notify me';
  }

  /* ── Pricing table ────────────────────────────────────────────────────── */

  function renderPricing(live) {
    var body = PF.$('[data-pricing]');
    if (!body) return;
    body.innerHTML = live.map(function (s) {
      return (
        '<tr>' +
        '<td><span class="svc"><span class="fi">' + icon(s.icon) + '</span>' + s.name + '</span></td>' +
        '<td data-label="Guide price"><span class="amt">' + s.price.label + '</span></td>' +
        '<td data-label="Timescale">' + s.duration + '</td>' +
        '<td data-label="Specialists">' + s.credential + '</td>' +
        '<td><a class="special" href="service.html?s=' + s.id + '">Details</a></td>' +
        '</tr>'
      );
    }).join('');
  }

  /* ── Concierge: ask the goal, show the plan ───────────────────────────── */

  function initConcierge() {
    var card = PF.$('[data-concierge]');
    if (!card) return;
    var ask = PF.$('[data-step="ask"]', card);
    var plan = PF.$('[data-step="plan"]', card);
    var dots = PF.$$('.step-dots span', card);

    var shortcuts = PF.$('[data-cq-services]', card);
    if (shortcuts) {
      PF.$('ul', shortcuts).innerHTML = PF.liveServices().map(function (s) {
        return '<li><a href="start.html?service=' + s.id + '">' + icon(s.icon) + (s.single || s.name) + '</a></li>';
      }).join('');
      shortcuts.hidden = false;
    }

    function setDots(n) {
      dots.forEach(function (dot, i) { dot.classList.toggle('on', i < n); });
    }

    function showAsk() {
      plan.hidden = true;
      ask.hidden = false;
      setDots(1);
      var first = PF.$('.goal', ask);
      if (first) first.focus();
    }

    function showPlan(goalId) {
      var goal = PF.goal(goalId);
      if (!goal) return;
      var rec = PF.recommend(goalId, {});
      var isOther = goalId === 'other';

      var items = rec.items.map(function (it, i) {
        var s = PF.service(it.id);
        return (
          '<li class="plan-item" style="--i:' + i + '">' +
          '<span class="plan-num">' + (i + 1) + '</span>' +
          '<span><span class="plan-name">' + icon(s.icon) + (s.single || s.name) +
          (it.optional ? ' <span class="opt-tag">Optional</span>' : '') + '</span>' +
          '<span class="plan-when">' + (isOther ? s.short : it.when) + '</span></span>' +
          '<span class="plan-price">' + PF.guidePrice(it.id, goalId, {}) + '</span>' +
          '</li>'
        );
      }).join('');

      var soon = rec.soon.slice(0, 3).map(function (id) { return PF.service(id).name; }).join(' · ');

      plan.innerHTML =
        '<div class="cq-top">' +
        '<button type="button" class="cq-back" data-back>' + icon('back') + 'Change</button>' +
        '<span class="cq-goal">' + icon(goal.icon) + goal.short + '</span>' +
        '</div>' +
        '<p class="cq-title" tabindex="-1">' + (isOther ? 'Pick what you need — we’ll guide you.' : 'Here’s your plan, in the right order.') + '</p>' +
        '<ol class="plan-list">' + items + '</ol>' +
        (soon && !isOther ? '<p class="cq-soon"><span class="tag">' + icon('sparkle') + 'Coming soon</span>' + esc(soon) + '</p>' : '') +
        '<a class="btn btn-primary btn-block" href="start.html?goal=' + goalId + '">' +
        (isOther ? 'Tell us what you need' : 'Start my plan') + icon('arrow') + '</a>' +
        '<p class="cq-note">' + icon('clock') + 'Takes about 2 minutes. No credit check.</p>';

      ask.hidden = true;
      plan.hidden = false;
      setDots(2);
      PF.$('.cq-title', plan).focus({ preventScroll: true });
    }

    card.addEventListener('click', function (e) {
      var g = e.target.closest('[data-goal]');
      if (g) {
        e.preventDefault();
        showPlan(g.getAttribute('data-goal'));
        return;
      }
      if (e.target.closest('[data-back]')) showAsk();
    });
  }
})(window, document);
