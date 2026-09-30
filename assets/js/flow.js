/*
  Properfy — guided flow (start.html)

  goal → only the questions relevant to that goal → your plan → details → done.
  Accepts ?goal=<id>, ?service=<id> (pins a service into the plan) and
  ?view=plan (shows the plan saved on this device).
*/
(function (w, d) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;

  var stage = PF.$('[data-stage]');
  var aside = PF.$('[data-aside]');
  var bar = PF.$('[data-progress]');
  if (!stage) return;

  var state = {
    goal: null,
    answers: {},
    toggles: {},   // service id → bool, the customer's own choices on the plan step
    soon: {},      // coming-soon service id → bool (notify me)
    pinned: null,  // service the customer arrived asking about
    contact: { pref: 'email' }
  };
  var current = null;
  var submitted = false;
  var lastPlanIds = [];

  /* ── Steps ────────────────────────────────────────────────────────────── */

  function sequence() {
    var steps = ['goal'];
    if (state.goal) {
      PF.questionsFor(state.goal, state.answers).forEach(function (q) { steps.push('q:' + q.id); });
      steps.push('plan', 'details');
    }
    return steps;
  }

  function question(key) {
    var id = key.slice(2);
    var qs = PF.questions[state.goal] || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) return qs[i];
    return null;
  }

  function optionsOf(q) {
    return typeof q.options === 'function' ? q.options() : q.options;
  }

  function answerLabel(q, value) {
    if (value == null || value === '') return '';
    if (q.type === 'text') return value;
    var opts = optionsOf(q);
    var values = Array.isArray(value) ? value : [value];
    return values.map(function (v) {
      for (var i = 0; i < opts.length; i++) if (opts[i].value === v) return opts[i].label;
      return v;
    }).join(', ');
  }

  function next() {
    var seq = sequence();
    var i = seq.indexOf(current);
    go(seq[Math.min(i + 1, seq.length - 1)]);
  }

  function go(step, opts) {
    opts = opts || {};
    if (!opts.fromHistory) w.history.pushState({ step: step }, '');
    render(step);
  }

  function render(step) {
    current = step;
    var leaving = PF.$('.step', stage);
    var draw = function () {
      if (step === 'goal') renderGoal();
      else if (step.indexOf('q:') === 0) renderQuestion(question(step));
      else if (step === 'plan') renderPlan();
      else if (step === 'details') renderDetails();
      updateProgress();
      updateAside();
      var h = PF.$('.step-title', stage);
      if (h) h.focus({ preventScroll: true });
      w.scrollTo({ top: 0, behavior: PF.reduceMotion ? 'auto' : 'smooth' });
    };
    if (leaving && !PF.reduceMotion) {
      leaving.classList.add('is-leaving');
      w.setTimeout(draw, 170);
    } else {
      draw();
    }
  }

  function updateProgress(value) {
    if (!bar) return;
    var seq = sequence();
    var p = value != null ? value : (seq.indexOf(current) + 1) / (seq.length + 1);
    bar.style.setProperty('--p', Math.max(0.04, p));
  }

  /* ── Shared bits ──────────────────────────────────────────────────────── */

  function stepHead(title, help, withBack) {
    var seq = sequence();
    var n = seq.indexOf(current) + 1;
    var goal = PF.goal(state.goal);
    var eyebrow = state.goal
      ? 'Step ' + n + ' of ' + seq.length + ' · ' + goal.short
      : 'Let’s get started';
    return (
      '<button type="button" class="back-link" data-back' + (withBack ? '' : ' hidden') + '>' + icon('back') + 'Back</button>' +
      '<p class="eyebrow">' + eyebrow + '</p>' +
      '<h1 class="step-title" tabindex="-1">' + title + '</h1>' +
      (help ? '<p class="step-help">' + help + '</p>' : '') +
      '<div class="plan-strip" data-strip></div>'
    );
  }

  function optionButton(o, pressed, square) {
    return (
      '<button type="button" class="option' + (square ? ' is-square' : '') + '" data-value="' + esc(o.value) + '" aria-pressed="' + (pressed ? 'true' : 'false') + '">' +
      (o.icon ? '<span class="opt-icon">' + icon(o.icon) + '</span>' : '') +
      '<span class="opt-text"><strong>' + o.label + '</strong>' + (o.hint ? '<small>' + o.hint + '</small>' : '') + '</span>' +
      '<span class="opt-check">' + icon('check') + '</span>' +
      '</button>'
    );
  }

  /* ── Step: goal ───────────────────────────────────────────────────────── */

  function renderGoal() {
    var pinned = state.pinned && PF.service(state.pinned);
    var help = pinned
      ? 'First, what are you doing? It helps us get your ' + (pinned.single || pinned.name).toLowerCase() + ' right. We serve ' + PF.config.serviceArea.name + ' only.'
      : 'We serve ' + PF.config.serviceArea.name + ' only. We’ll just ask what’s relevant to you: no jargon, no credit check.';
    stage.innerHTML =
      '<div class="step">' +
      stepHead('What are you doing with your property?', help, false) +
      '<div class="options cols-2" role="group" aria-label="What are you doing?">' +
      PF.goals.map(function (g) {
        return optionButton({ value: g.id, label: g.label, hint: g.hint, icon: g.icon }, state.goal === g.id);
      }).join('') +
      '</div>' +
      '</div>';

    PF.$$('.option', stage).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-value');
        if (state.goal !== id) {
          state.goal = id;
          state.answers = {};
          state.toggles = {};
        }
        PF.$$('.option', stage).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        updateAside();
        w.setTimeout(next, 220);
      });
    });
  }

  /* ── Step: a question ─────────────────────────────────────────────────── */

  function renderQuestion(q) {
    if (!q) { go('goal'); return; }
    var value = state.answers[q.id];
    var body = '';

    if (q.type === 'text') {
      body =
        '<div class="field"><label class="sr-only" for="q-text">' + q.title + '</label>' +
        '<textarea id="q-text" rows="4" placeholder="' + esc(q.placeholder || '') + '">' + esc(value || '') + '</textarea></div>' +
        '<div class="step-actions"><button type="button" class="btn btn-primary btn-lg" data-continue>Continue' + icon('arrow') + '</button>' +
        (q.optional ? '<button type="button" class="btn btn-lg" data-skip>Skip</button>' : '') + '</div>';
    } else if (q.type === 'multi') {
      var picked = value || [];
      body =
        '<div class="options" role="group" aria-label="' + esc(q.title) + '">' +
        optionsOf(q).map(function (o) { return optionButton(o, picked.indexOf(o.value) !== -1, true); }).join('') +
        '</div>' +
        '<div class="step-actions"><button type="button" class="btn btn-primary btn-lg" data-continue>Continue' + icon('arrow') + '</button>' +
        '<span class="faint" data-multi-note>' + (picked.length ? '' : 'Not sure? Continue and we’ll show you everything.') + '</span></div>';
    } else {
      body =
        '<div class="options ' + (q.layout || '') + '" role="group" aria-label="' + esc(q.title) + '">' +
        optionsOf(q).map(function (o) { return optionButton(o, value === o.value); }).join('') +
        '</div>';
    }

    stage.innerHTML = '<div class="step">' + stepHead(q.title, q.help, true) + body + '</div>';

    if (q.type === 'text') {
      var ta = PF.$('#q-text', stage);
      PF.$('[data-continue]', stage).addEventListener('click', function () {
        state.answers[q.id] = ta.value.trim();
        next();
      });
      var skip = PF.$('[data-skip]', stage);
      if (skip) skip.addEventListener('click', function () { delete state.answers[q.id]; next(); });
      return;
    }

    PF.$$('.option', stage).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-value');
        if (q.type === 'multi') {
          var list = (state.answers[q.id] || []).slice();
          var i = list.indexOf(v);
          if (i === -1) list.push(v); else list.splice(i, 1);
          state.answers[q.id] = list;
          btn.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
          var note = PF.$('[data-multi-note]', stage);
          if (note) note.textContent = list.length ? '' : 'Not sure? Continue and we’ll show you everything.';
          updateAside();
          return;
        }
        state.answers[q.id] = v;
        PF.$$('.option', stage).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        updateAside();
        w.setTimeout(next, 220);
      });
    });

    var cont = PF.$('[data-continue]', stage);
    if (cont) cont.addEventListener('click', next);
  }

  /* ── Recommendations with the customer's choices applied ──────────────── */

  function planItems() {
    if (!state.goal) return [];
    var rec = PF.recommend(state.goal, state.answers);
    var items = rec.items.map(function (it) { return Object.assign({}, it); });
    if (state.pinned) {
      var has = items.some(function (it) { return it.id === state.pinned; });
      if (!has) {
        items.unshift({ id: state.pinned, when: 'You asked about this', why: PF.service(state.pinned).blurb, optional: false });
      }
    }
    items.forEach(function (it) {
      it.pinned = it.id === state.pinned;
      it.on = Object.prototype.hasOwnProperty.call(state.toggles, it.id)
        ? state.toggles[it.id]
        : !it.optional || it.pinned;
    });
    return items;
  }

  function soonItems() {
    return state.goal ? PF.recommend(state.goal, state.answers).soon : [];
  }

  /* ── Step: plan ───────────────────────────────────────────────────────── */

  function renderPlan() {
    var goal = PF.goal(state.goal);
    var items = planItems();
    var soon = soonItems();

    var list = items.map(function (it, i) {
      var s = PF.service(it.id);
      return (
        '<label class="svc-toggle' + (it.on ? ' is-on' : '') + '" style="--i:' + i + '">' +
        '<input type="checkbox" class="sr-only" data-svc="' + it.id + '"' + (it.on ? ' checked' : '') + '>' +
        '<span class="fi">' + icon(s.icon) + '</span>' +
        '<span><span class="svc-name">' + (s.single || s.name) +
        (it.pinned ? ' <span class="opt-tag">You asked for this</span>' : it.optional ? ' <span class="opt-tag">Optional</span>' : '') +
        '</span><span class="svc-when">' + (i + 1) + ' · ' + it.when + '</span></span>' +
        '<span class="switch" aria-hidden="true"></span>' +
        '<span class="why">' + it.why + '</span>' +
        '<span class="meta">' +
        '<span>' + icon('pound') + 'Guide <b>' + PF.guidePrice(it.id, state.goal, state.answers) + '</b></span>' +
        '<span>' + icon('shield') + s.credential + '</span>' +
        '<span>' + icon('clock') + s.duration + '</span>' +
        '</span>' +
        (s.risk ? '<span class="risk">' + s.risk + '</span>' : '') +
        '</label>'
      );
    }).join('');

    var soonHtml = soon.length
      ? '<p class="label" style="margin-top:2rem">Coming soon to Properfy</p>' +
        '<p class="faint small" style="margin:0">Useful for ' + goal.short.toLowerCase() + '. Want a heads-up when they launch?</p>' +
        '<div class="soon-row">' + soon.map(function (id) {
          var s = PF.service(id);
          var on = !!state.soon[id];
          return '<button type="button" class="soon-chip" data-soon="' + id + '" aria-pressed="' + on + '">' + icon(on ? 'check' : 'bell') + s.name + '</button>';
        }).join('') + '</div>'
      : '';

    stage.innerHTML =
      '<div class="step">' +
      stepHead('Here’s your plan.', 'Everything you need for ' + goal.short.toLowerCase() + ', in the right order. Switch off anything you don’t need.', true) +
      '<div class="svc-list">' + list + '</div>' +
      soonHtml +
      '<div class="step-actions"><button type="button" class="btn btn-primary btn-lg" data-continue>Looks good' + icon('arrow') + '</button>' +
      '<span class="faint" data-count></span></div>' +
      '</div>';

    function sync() {
      var n = planItems().filter(function (it) { return it.on; }).length;
      var btn = PF.$('[data-continue]', stage);
      btn.disabled = n === 0;
      PF.$('[data-count]', stage).textContent = n === 0
        ? 'Pick at least one service to continue.'
        : n + ' service' + (n === 1 ? '' : 's') + ' selected · free, no obligation';
    }

    PF.$$('[data-svc]', stage).forEach(function (input) {
      input.addEventListener('change', function () {
        state.toggles[input.getAttribute('data-svc')] = input.checked;
        input.closest('.svc-toggle').classList.toggle('is-on', input.checked);
        sync();
        updateAside();
      });
    });
    PF.$$('[data-soon]', stage).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-soon');
        state.soon[id] = !state.soon[id];
        btn.setAttribute('aria-pressed', state.soon[id]);
        btn.innerHTML = icon(state.soon[id] ? 'check' : 'bell') + PF.service(id).name;
      });
    });
    PF.$('[data-continue]', stage).addEventListener('click', next);
    sync();
  }

  /* ── Step: details ────────────────────────────────────────────────────── */

  function renderDetails(errorMsg) {
    var c = state.contact;
    var chosen = planItems().filter(function (it) { return it.on; });
    var wantsMortgage = chosen.some(function (it) { return it.id === 'mortgage'; });

    stage.innerHTML =
      '<div class="step">' +
      stepHead('Where should we send your quotes?', 'We’ll only share your details with specialists for the services you’ve chosen.', true) +
      (errorMsg ? '<div class="error-box" role="alert">' + errorMsg + '</div>' : '') +
      '<form novalidate data-details>' +
      '<div class="fields">' +
      '<div class="field full"><label for="f-name">Your name</label><input type="text" id="f-name" name="name" autocomplete="name" value="' + esc(c.name || '') + '"></div>' +
      '<div class="field"><label for="f-email">Email</label><input type="email" id="f-email" name="email" autocomplete="email" inputmode="email" value="' + esc(c.email || '') + '"></div>' +
      '<div class="field"><label for="f-phone">Phone <span class="opt">' + (c.pref === 'phone' ? '' : '(optional)') + '</span></label><input type="tel" id="f-phone" name="phone" autocomplete="tel" inputmode="tel" value="' + esc(c.phone || '') + '"></div>' +
      '<div class="field"><label for="f-postcode">Your postcode <span class="opt">(' + PF.config.serviceArea.name + ' only)</span></label><input type="text" id="f-postcode" name="postcode" autocomplete="postal-code" autocapitalize="characters" value="' + esc(c.postcode || '') + '"></div>' +
      '<div class="field"><span class="label" id="pref-label">Best way to reach you</span>' +
      '<div class="segmented" role="group" aria-labelledby="pref-label">' +
      '<button type="button" data-pref="email" aria-pressed="' + (c.pref === 'email') + '">Email</button>' +
      '<button type="button" data-pref="phone" aria-pressed="' + (c.pref === 'phone') + '">Phone</button>' +
      '</div></div>' +
      '</div>' +
      (wantsMortgage ? '<p class="faint small" style="margin:-.25rem 0 1.25rem">Mortgage advisers usually start with a short call — adding a number speeds things up.</p>' : '') +
      '<label class="check"><input type="checkbox" name="consent"' + (c.consent ? ' checked' : '') + '><span>I agree to Properfy sharing my details with specialists for the services I’ve chosen, so they can contact me about them. See our <a class="inline" href="privacy.html" target="_blank" rel="noopener">privacy notice</a>.</span></label>' +
      '<label class="check"><input type="checkbox" name="updates"' + (c.updates ? ' checked' : '') + '><span>Send me occasional moving tips and Properfy updates. Unsubscribe anytime.</span></label>' +
      '<div class="hp" aria-hidden="true"><label for="f-hp">Leave this empty</label><input type="text" id="f-hp" name="_honey" tabindex="-1" autocomplete="off"></div>' +
      '<div class="step-actions" style="margin-top:1.5rem"><button type="submit" class="btn btn-primary btn-lg">Send my plan' + icon('arrow') + '</button></div>' +
      '<ul class="reassure"><li>' + icon('check') + 'Free, no obligation</li><li>' + icon('check') + 'No credit check</li><li>' + icon('check') + 'Your data is never sold</li></ul>' +
      '</form>' +
      '</div>';

    var form = PF.$('[data-details]', stage);

    PF.$$('[data-pref]', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        c.pref = btn.getAttribute('data-pref');
        PF.$$('[data-pref]', form).forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
        PF.$('label[for="f-phone"] .opt', form).textContent = c.pref === 'phone' ? '' : '(optional)';
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      c.name = el.name.value.trim();
      c.email = el.email.value.trim();
      c.phone = el.phone.value.trim();
      c.postcode = el.postcode.value.trim();
      c.consent = el.consent.checked;
      c.updates = el.updates.checked;
      c.honey = el._honey.value;

      PF.$$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
      PF.$$('.field-error', form).forEach(function (x) { x.remove(); });
      var ok = true;
      function fail(input, msg, after) {
        ok = false;
        input.setAttribute('aria-invalid', 'true');
        (after || input).insertAdjacentHTML('afterend', '<p class="field-error">' + msg + '</p>');
      }
      if (!c.name) fail(el.name, 'Please tell us your name.');
      if (!PF.validEmail(c.email)) fail(el.email, 'Please enter a valid email address.');
      if (c.pref === 'phone' && !c.phone) fail(el.phone, 'Please add a phone number we can call.');
      else if (c.phone && !PF.validUkPhone(c.phone)) fail(el.phone, 'Please enter a UK phone number, for example 07700 900123.');
      var area = PF.checkPostcode(c.postcode);
      if (area.ok) c.postcode = area.postcode;
      else fail(el.postcode, area.message);
      if (!c.consent) fail(el.consent, 'We need your OK to pass your details to the specialists.', el.consent.closest('.check'));
      if (!ok) {
        PF.$('[aria-invalid="true"]', form).focus();
        return;
      }
      submit();
    });
  }

  /* ── Submit → building → done ─────────────────────────────────────────── */

  function makeRef() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    var buf = new Uint8Array(6);
    (w.crypto || w.msCrypto).getRandomValues(buf);
    for (var i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    return 'PRF-' + out;
  }

  function submit() {
    var chosen = planItems().filter(function (it) { return it.on; });
    var soon = Object.keys(state.soon).filter(function (id) { return state.soon[id]; });
    var ref = makeRef();
    var c = state.contact;

    var answers = PF.questionsFor(state.goal, state.answers).map(function (q) {
      return { id: q.id, question: q.title, answer: answerLabel(q, state.answers[q.id]) };
    }).filter(function (a) { return a.answer; });

    var payload = {
      ref: ref,
      goal: state.goal,
      answers: answers,
      services: chosen.map(function (it) { return { id: it.id, when: it.when }; }),
      notify: soon,
      contact: { name: c.name, email: c.email, phone: c.phone, postcode: c.postcode, preferred: c.pref },
      consent: { shareWithPartners: true, marketing: !!c.updates, at: new Date().toISOString() },
      source: w.location.href,
      _honey: c.honey
    };

    // Building screen: the brand mark morphs while we save.
    current = 'building';
    updateProgress(0.96);
    stage.innerHTML =
      '<div class="step building" role="status" aria-live="polite">' + PF.mark('morph-loop') +
      '<p data-msg>Putting everything in the right order…</p></div>';
    var msgs = ['Preparing your requests…', 'Saving your plan…'];
    var m = 0;
    var timer = w.setInterval(function () {
      var el = PF.$('[data-msg]', stage);
      if (el && m < msgs.length) el.textContent = msgs[m++];
    }, 650);

    var wait = new Promise(function (r) { w.setTimeout(r, PF.reduceMotion ? 300 : 1900); });

    Promise.all([PF.send('plan', payload), wait]).then(function (res) {
      w.clearInterval(timer);
      var plan = {
        v: 1,
        ref: ref,
        createdAt: new Date().toISOString(),
        goal: state.goal,
        answers: answers,
        services: chosen.map(function (it) { return { id: it.id, when: it.when }; }),
        notify: soon,
        contact: { name: c.name, email: c.email, preferred: c.pref },
        sent: res[0].sent
      };
      PF.store.set(PF.config.storageKey, plan);
      submitted = true;
      w.history.replaceState({ step: 'done' }, '');
      renderDone(plan);
    }).catch(function () {
      w.clearInterval(timer);
      current = 'details';
      renderDetails('We couldn’t send your plan just now. Please check your connection and try again — or email <a class="inline" href="mailto:' + PF.config.contact.email + '">' + PF.config.contact.email + '</a>.');
      updateProgress();
    });
  }

  function renderDone(plan, fromStorage) {
    current = 'done';
    updateProgress(1);
    var goal = PF.goal(plan.goal) || { short: 'your property' };
    var first = (plan.contact.name || '').split(' ')[0];
    var created = new Date(plan.createdAt);

    var items = plan.services.map(function (it, i) {
      var s = PF.service(it.id);
      if (!s) return '';
      return (
        '<li style="--i:' + i + '">' +
        '<span class="tl-icon">' + icon(s.icon) + '</span>' +
        '<h3>' + (s.single || s.name) + '</h3>' +
        '<span class="tl-when">' + esc(it.when) + '</span>' +
        '<p class="tl-next">' + icon('check') + '<span>' + s.next + '</span></p>' +
        '<div class="tl-links"><a href="service.html?s=' + s.id + '">How it works</a></div>' +
        '</li>'
      );
    }).join('');

    var soon = (plan.notify || []).map(function (id, i) {
      var s = PF.service(id);
      if (!s) return '';
      return (
        '<li style="--i:' + (plan.services.length + i) + '">' +
        '<span class="tl-icon soon">' + icon(s.icon) + '</span>' +
        '<h3>' + s.name + '</h3>' +
        '<span class="tl-when">Coming soon</span>' +
        '<p class="tl-next">' + icon('bell') + '<span>We’ll let you know as soon as it’s live.</span></p>' +
        '</li>'
      );
    }).join('');

    var cfg = PF.config.contact;

    stage.innerHTML =
      '<div class="step">' +
      '<div class="done-top"><span class="ok-chip">' + icon('check') + (fromStorage ? 'Your saved plan' : 'Plan saved') + '</span>' +
      '<span class="ref-chip">Ref ' + esc(plan.ref) + '</span>' +
      (fromStorage ? '<span class="ref-chip">' + created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span>' : '') +
      '</div>' +
      '<h1 class="step-title" tabindex="-1">' + (first ? (fromStorage ? 'Welcome back, ' : 'You’re all set, ') + esc(first) + '.' : 'You’re all set.') + '</h1>' +
      '<p class="step-help">Your plan for ' + esc(goal.short.toLowerCase()) + ' — and exactly what happens next. We’ll be in touch by ' + (plan.contact.preferred === 'phone' ? 'phone' : 'email') + '.</p>' +
      (!plan.sent
        ? '<div class="notice">' + icon('info') + '<span><strong>Preview mode.</strong> Your plan is saved on this device only — nothing was sent to specialists yet. Connect <code>PF.config.leadEndpoint</code> to go live.</span></div>'
        : '') +
      '<ol class="timeline">' + items + soon + '</ol>' +
      '<div class="actions"><a class="btn btn-primary" href="index.html">Back to home' + icon('arrow') + '</a>' +
      '<button type="button" class="btn" data-restart>Start a new plan</button></div>' +
      '<p class="faint small">Your plan is saved on this device. Questions? Email <a class="inline" href="mailto:' + cfg.email + '">' + cfg.email + '</a> or call <a class="inline" href="tel:' + cfg.phoneHref + '">' + cfg.phone + '</a>.</p>' +
      '</div>';

    PF.$('[data-restart]', stage).addEventListener('click', function () {
      PF.store.remove(PF.config.storageKey);
      w.location.href = 'start.html';
    });

    renderDoneAside(plan);
    var h = PF.$('.step-title', stage);
    if (h) h.focus({ preventScroll: true });
    w.scrollTo({ top: 0, behavior: PF.reduceMotion ? 'auto' : 'smooth' });
  }

  /* ── Aside: the plan building up as you answer ────────────────────────── */

  function stripHtml(items) {
    if (!items.length) return '';
    return '<span>Your plan:</span>' + items.map(function (it) {
      var s = PF.service(it.id);
      return '<span class="chip">' + icon(s.icon) + (s.single || s.name) + '</span>';
    }).join('');
  }

  function updateAside() {
    var items = planItems().filter(function (it) { return it.on; });
    var strip = PF.$('[data-strip]', stage);
    if (strip) strip.innerHTML = current === 'plan' ? '' : stripHtml(items);
    if (!aside) return;

    var goal = state.goal && PF.goal(state.goal);
    var ids = items.map(function (it) { return it.id; });
    var list = items.length
      ? '<ol>' + items.map(function (it) {
          var s = PF.service(it.id);
          var fresh = lastPlanIds.indexOf(it.id) === -1;
          return '<li' + (fresh ? '' : ' style="animation:none"') + '><span class="fi">' + icon(s.icon) + '</span><span>' + (s.single || s.name) +
            '<small>' + esc(it.when) + '</small></span></li>';
        }).join('') + '</ol>'
      : '<p class="empty">Tell us what you’re doing and your plan will appear here.</p>';
    lastPlanIds = ids;

    aside.innerHTML =
      '<div class="plan-card">' +
      '<div class="plan-card-head">' + PF.mark() + '<div><strong>Your plan so far</strong><small>' +
      (goal ? esc(goal.short) : 'Nothing yet') + '</small></div></div>' +
      list +
      '<p class="plan-card-foot">' + icon('lock') + '<span>Nothing is shared until you say so.</span></p>' +
      '</div>';
  }

  function renderDoneAside(plan) {
    if (!aside) return;
    var cfg = PF.config.contact;
    var answers = (plan.answers || []).map(function (a) {
      return '<li><span class="fi">' + icon('check') + '</span><span>' + esc(a.answer) + '<small>' + esc(a.question) + '</small></span></li>';
    }).join('');
    aside.innerHTML =
      '<div class="plan-card">' +
      '<div class="plan-card-head">' + PF.mark() + '<div><strong>What you told us</strong><small>' + esc((PF.goal(plan.goal) || {}).short || '') + '</small></div></div>' +
      (answers ? '<ol>' + answers + '</ol>' : '') +
      '<p class="plan-card-foot">' + icon('chat') + '<span>Need a hand? Call <a class="inline" href="tel:' + cfg.phoneHref + '">' + cfg.phone + '</a> · ' + cfg.hours + '</span></p>' +
      '</div>';
  }

  /* ── Start ────────────────────────────────────────────────────────────── */

  d.addEventListener('click', function (e) {
    if (e.target.closest('[data-back]')) w.history.back();
  });

  w.addEventListener('popstate', function (e) {
    if (submitted) {
      // The plan's been sent — going back leaves the flow rather than
      // reopening a submitted form.
      w.location.replace('index.html');
      return;
    }
    var step = e.state && e.state.step;
    if (!step) return;
    if (step !== 'goal' && sequence().indexOf(step) === -1) step = 'goal';
    render(step);
  });

  PF.ready(function () {
    var p = PF.params();

    if (p.view === 'plan') {
      var saved = PF.store.get(PF.config.storageKey);
      if (saved && saved.ref) {
        submitted = true;
        renderDone(saved, true);
        return;
      }
    }

    var svc = p.service && PF.service(p.service);
    if (svc && svc.status === 'live') state.pinned = svc.id;
    if (p.goal && PF.goal(p.goal)) state.goal = p.goal;

    w.history.replaceState({ step: 'goal' }, '');
    if (state.goal) go(sequence()[1]);
    else render('goal');
  });
})(window, document);
