/*
  Properfy — Start your move (start.html)
  1. What are you doing?  2. About the property  3. Who's already helping you?
  4. Your details. The finished move is emailed to Properfy and saved on this
  device for the "My move" tracker. ?journey=<key> skips straight to step 2.
*/
(function (w, d) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;

  var root = PF.$('[data-flow]');
  if (!root) return;

  var existing = PF.getMove();
  var step = 0;
  var sending = false;
  var ob = {
    journey: 'buy', address: '', postcode: '', price: '',
    team: { agent: 'have', broker: 'intro', solicitor: 'intro' },
    name: '', email: '', phone: '', consent: false
  };

  var preset = PF.params().journey;
  if (preset && PF.journeys[preset]) { ob.journey = preset; step = 1; }

  function titles() {
    return [
      ['What are you doing?', 'Pick one to get started.'],
      ['About the ' + PF.journeys[ob.journey].place, 'So your team knows which home this is.'],
      ['Who’s already helping you?', 'Keep your own people, or we’ll introduce trusted ones. Mix and match.'],
      ['Your details', 'So we can set up your move and introduce your team.']
    ];
  }

  /* ── Steps ────────────────────────────────────────────────────────────── */

  function stepBody() {
    var j = PF.journeys[ob.journey];

    if (step === 0) {
      return (
        '<div class="tiles row" role="group" aria-label="What are you doing?">' +
        PF.journeyKeys.map(function (k) {
          var jj = PF.journeys[k];
          return '<button type="button" class="tile" data-pick="' + k + '" aria-pressed="' + (ob.journey === k) + '">' +
            icon(jj.icon) + '<span class="tile-label">' + esc(jj.label) + '</span></button>';
        }).join('') +
        '</div>' +
        (existing ? '<span class="hint">You already have a move saved on this device. Starting a new one replaces it.</span>' : '')
      );
    }

    if (step === 1) {
      var lookingHint = ob.journey === 'buy'
        ? '<span class="hint">Not found a home yet? Put the area you’re looking in and its postcode.</span>'
        : '';
      return (
        '<div class="field-pair">' +
        '<div class="field"><label for="ob-address">' + esc(j.addr) + '</label>' +
        '<input class="input" id="ob-address" name="address" autocomplete="street-address" placeholder="e.g. 14 Maple Terrace, London" value="' + esc(ob.address) + '"></div>' +
        '<div class="field"><label for="ob-postcode">Postcode</label>' +
        '<input class="input" id="ob-postcode" name="postcode" autocomplete="postal-code" autocapitalize="characters" placeholder="e.g. E8 3AB" value="' + esc(ob.postcode) + '"></div>' +
        '</div>' +
        lookingHint +
        '<div class="field"><label for="ob-price">' + esc(j.price) + '</label>' +
        '<input class="input" id="ob-price" name="price" inputmode="numeric" placeholder="e.g. 425,000" value="' + esc(ob.price) + '"></div>' +
        '<span class="hint">Not sure yet? Leave it blank. You can add it later. We cover homes in ' + PF.config.serviceArea.name + ' only.</span>'
      );
    }

    if (step === 2) {
      return Object.keys(PF.roles).map(function (k) {
        var r = PF.roles[k];
        var have = ob.team[k] === 'have';
        return (
          '<div class="team-row">' + icon(r.icon) +
          '<div class="team-row-text"><strong>' + esc(r.label) + '</strong><span>' + esc(r.why) + '</span></div>' +
          '<div class="seg" role="group" aria-label="' + esc(r.label) + '">' +
          '<button type="button" class="seg-opt" data-team="' + k + '" data-choice="have" aria-pressed="' + have + '">I have one</button>' +
          '<button type="button" class="seg-opt" data-team="' + k + '" data-choice="intro" aria-pressed="' + !have + '">Introduce me</button>' +
          '</div></div>'
        );
      }).join('');
    }

    return (
      '<div class="field"><label for="ob-name">Your name</label>' +
      '<input class="input" id="ob-name" name="name" autocomplete="name" placeholder="First and last name" value="' + esc(ob.name) + '"></div>' +
      '<div class="field"><label for="ob-email">Email</label>' +
      '<input class="input" id="ob-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(ob.email) + '"></div>' +
      '<div class="field"><label for="ob-phone">Phone (optional)</label>' +
      '<input class="input" id="ob-phone" name="phone" type="tel" autocomplete="tel" placeholder="e.g. 07700 900123" value="' + esc(ob.phone) + '"></div>' +
      '<label class="check"><input type="checkbox" name="consent"' + (ob.consent ? ' checked' : '') + '>' +
      '<span>I agree to Properfy sharing my details with the specialists it introduces or arranges for me. See our <a href="privacy.html">privacy notice</a>.</span></label>' +
      '<div class="hp" aria-hidden="true"><label for="ob-hp">Leave this empty</label><input type="text" id="ob-hp" name="_honey" tabindex="-1" autocomplete="off"></div>' +
      '<span class="hint">We’ll never share your details without asking.</span>'
    );
  }

  function render(focusTitle) {
    var t = titles()[step];
    root.innerHTML =
      '<div class="dots" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) {
        return '<span class="' + (i <= step ? 'on' : '') + (i === step ? ' current' : '') + '"></span>';
      }).join('') + '</div>' +
      '<div class="flow-head"><span class="flow-step">Step ' + (step + 1) + ' of 4</span>' +
      '<h1 tabindex="-1">' + esc(t[0]) + '</h1><span class="flow-sub">' + esc(t[1]) + '</span></div>' +
      '<form class="flow-body" novalidate data-form>' + stepBody() +
      '<p class="flow-error" role="alert" hidden data-error></p>' +
      '<div class="actions">' +
      '<button type="button" class="btn btn-secondary btn-md" data-back>Back</button>' +
      '<button type="submit" class="btn btn-primary btn-md" data-next>' + (step === 3 ? 'Create my move' : 'Continue') + icon('arrow-right') + '</button>' +
      '</div></form>';
    if (focusTitle) PF.$('h1', root).focus({ preventScroll: true });
  }

  function go(next) {
    step = next;
    w.history.pushState({ step: step, journey: ob.journey }, '');
    render(true);
    w.scrollTo(0, 0);
  }

  /* ── Validation ───────────────────────────────────────────────────────── */

  function showError(msg, field) {
    var el = PF.$('[data-error]', root);
    el.innerHTML = icon('warning-circle') + '<span>' + esc(msg) + '</span>';
    el.hidden = false;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  function clearErrors() {
    PF.$$('[aria-invalid]', root).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    var el = PF.$('[data-error]', root);
    if (el) el.hidden = true;
  }

  // Reads the current step's fields into `ob`. Returns false if invalid.
  function collect() {
    var form = PF.$('[data-form]', root);
    var el = form.elements;
    clearErrors();

    if (step === 1) {
      ob.address = el.address.value.trim();
      ob.postcode = el.postcode.value.trim();
      var digits = el.price.value.replace(/[^\d]/g, '');
      ob.price = digits ? Number(digits).toLocaleString('en-GB') : '';
      if (ob.address.length < 5) { showError('Add the address, or at least the street and town.', el.address); return false; }
      var area = PF.checkPostcode(ob.postcode);
      if (!area.ok) { showError(area.message, el.postcode); return false; }
      ob.postcode = area.postcode;
    }

    if (step === 3) {
      ob.name = el.name.value.trim();
      ob.email = el.email.value.trim();
      ob.phone = el.phone.value.trim();
      ob.consent = el.consent.checked;
      ob.honey = el._honey.value;
      if (!ob.name) { showError('Add your name.', el.name); return false; }
      if (!PF.validEmail(ob.email)) { showError('That email doesn’t look right.', el.email); return false; }
      if (ob.phone && !PF.validUkPhone(ob.phone)) { showError('Use a UK phone number, for example 07700 900123.', el.phone); return false; }
      if (!ob.consent) { showError('Tick the box so we can introduce and arrange your team.', el.consent); return false; }
    }
    return true;
  }

  /* ── Create the move ──────────────────────────────────────────────────── */

  function createMove() {
    var intros = Object.keys(ob.team).filter(function (k) { return ob.team[k] === 'intro'; });
    var introText = intros.length
      ? intros.map(function (k) { return PF.roles[k].short; }).join(' and ') + ' introductions requested.'
      : 'No introductions requested.';
    introText = introText.charAt(0).toUpperCase() + introText.slice(1);

    var ref = PF.makeRef();
    var btn = PF.$('[data-next]', root);
    sending = true;
    btn.disabled = true;
    btn.textContent = 'Setting up your move…';

    PF.send('move', {
      ref: ref, journey: ob.journey, address: ob.address, postcode: ob.postcode, price: ob.price,
      team: ob.team, name: ob.name, email: ob.email, phone: ob.phone, _honey: ob.honey
    }).then(function (res) {
      PF.saveMove({
        v: 2, ref: ref, createdAt: new Date().toISOString(), sent: res.sent,
        journey: ob.journey, address: ob.address, postcode: ob.postcode, price: ob.price,
        team: ob.team, name: ob.name, email: ob.email, phone: ob.phone,
        stage: 0, arranged: {},
        updates: [{ who: 'Properfy', text: 'Move created. ' + introText, at: new Date().toISOString(), sys: true }]
      });
      w.location.href = 'move.html?new=1';
    }).catch(function () {
      sending = false;
      btn.disabled = false;
      btn.innerHTML = 'Create my move' + icon('arrow-right');
      showError('We couldn’t set up your move just now. Check your connection and try again.');
    });
  }

  /* ── Events ───────────────────────────────────────────────────────────── */

  root.addEventListener('click', function (e) {
    var pick = e.target.closest('[data-pick]');
    if (pick) {
      ob.journey = pick.getAttribute('data-pick');
      PF.$$('[data-pick]', root).forEach(function (b) { b.setAttribute('aria-pressed', b === pick ? 'true' : 'false'); });
      return;
    }
    var seg = e.target.closest('[data-team]');
    if (seg) {
      var k = seg.getAttribute('data-team');
      ob.team[k] = seg.getAttribute('data-choice');
      PF.$$('[data-team="' + k + '"]', root).forEach(function (b) { b.setAttribute('aria-pressed', b === seg ? 'true' : 'false'); });
      return;
    }
    if (e.target.closest('[data-back]')) {
      if (sending) return;
      if (step === 0) w.location.href = 'index.html';
      else w.history.back();
    }
  });

  root.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending || !collect()) return;
    if (step < 3) go(step + 1);
    else createMove();
  });

  w.addEventListener('popstate', function (e) {
    if (sending) return;
    var s = e.state && typeof e.state.step === 'number' ? e.state.step : 0;
    step = Math.max(0, Math.min(3, s));
    render(true);
  });

  w.history.replaceState({ step: step, journey: ob.journey }, '');
  render(false);
})(window, document);
