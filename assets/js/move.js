/*
  Properfy — My move (move.html)
  The customer's tracker, saved on this device. "Arrange … with Properfy"
  emails a request to Properfy; "Mark as done" moves the tracker on.
*/
(function (w, d) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;

  var root = PF.$('[data-dash]');
  if (!root) return;

  var move = PF.getMove();
  var confirmRemove = false;

  function when(iso) {
    var mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hours = Math.round(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.round(hours / 24);
    return days === 1 ? 'Yesterday' : days + ' days ago';
  }

  function firstName() { return move.name.split(' ')[0]; }

  function addUpdate(text, sys) {
    move.updates.unshift({ who: firstName() + ' · You', text: text, at: new Date().toISOString(), sys: !!sys });
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  function renderEmpty() {
    root.innerHTML =
      '<section class="empty">' +
      '<span class="kicker">My move</span>' +
      '<h1 class="dash-addr">No move on this device yet.</h1>' +
      '<p class="text-muted">Tell us what you’re doing and we’ll set up your tracker, with every step in order.</p>' +
      '<a class="btn btn-primary btn-md" href="start.html">Start your move' + icon('arrow-right') + '</a>' +
      '</section>';
  }

  function stepItem(st, i, n) {
    var done = i < move.stage;
    var current = i === move.stage;
    var ownerLabel = st.owner === 'you' ? 'You' : 'Your ' + PF.roles[st.owner].short;
    var rail = done ? icon('check-circle-fill', 'done-icon') : '<span class="ring' + (current ? ' current' : '') + '"></span>';
    var body = '';

    if (current) {
      var actions = '';
      if (st.service) {
        actions += move.arranged[i]
          ? '<span class="tag tag-accent">' + icon('check') + esc(st.service) + ' requested · we’ll be in touch within a working day</span>'
          : '<button type="button" class="btn btn-primary btn-sm" data-arrange="' + i + '">' + icon('sparkle') + 'Arrange ' + esc(st.service.toLowerCase()) + ' with Properfy</button>';
      }
      if (st.owner !== 'you') {
        actions += '<span class="tl-waiting">' + icon('hourglass-medium') + 'Your ' + esc(PF.roles[st.owner].short) + ' handles this step.</span>';
      }
      actions += '<button type="button" class="btn btn-secondary btn-sm" data-done="' + i + '">Mark as done</button>';
      body = '<span class="tl-desc">' + esc(st.d) + '</span><div class="tl-actions">' + actions + '</div><span data-step-error></span>';
    }

    return (
      '<li class="tl-item' + (current ? ' current' : '') + '">' +
      '<div class="tl-rail">' + rail + (i < n - 1 ? '<span class="tl-line"></span>' : '') + '</div>' +
      '<div class="tl-body"><div class="tl-head"><span class="tl-title">' + esc(st.t) + '</span>' +
      '<span class="tl-owner">' + esc(ownerLabel) + '</span></div>' + body + '</div>' +
      '</li>'
    );
  }

  function render() {
    var j = PF.journeys[move.journey];
    var steps = j.steps;
    var n = steps.length;
    var finished = move.stage >= n;
    var pct = Math.round(move.stage / n * 100) + '%';

    var team = Object.keys(PF.roles).map(function (k) {
      var r = PF.roles[k];
      var intro = move.team[k] === 'intro';
      return (
        '<div class="team-card"><span class="avatar">' + icon(r.icon) + '</span>' +
        '<div class="team-card-text"><strong>' + (intro ? 'Being introduced' : 'Your existing ' + esc(r.short)) + '</strong>' +
        '<span>' + esc(r.label) + '</span></div>' +
        '<span class="tag ' + (intro ? 'tag-accent' : 'tag-neutral') + '">' + (intro ? 'Within 1 day' : 'Your own') + '</span></div>'
      );
    }).join('');

    var updates = move.updates.map(function (u) {
      return (
        '<div class="update"><span class="update-bar' + (u.sys ? ' sys' : '') + '"></span>' +
        '<div class="update-body"><span class="update-who">' + esc(u.who) + ' · ' + when(u.at) + '</span>' +
        '<span class="update-text">' + esc(u.text) + '</span></div></div>'
      );
    }).join('');

    root.innerHTML =
      '<div class="dash">' +
      '<div class="dash-main">' +
      '<div class="dash-title"><span class="dash-hello">Hi ' + esc(firstName()) + ', here’s your move</span>' +
      '<span class="kicker">' + esc(j.label) + '</span>' +
      '<h1 class="dash-addr">' + esc(move.address) + '</h1></div>' +
      '<div class="dash-progress"><div class="dash-progress-labels"><span>' +
      (finished ? 'All done. Congratulations!' : 'Step ' + (move.stage + 1) + ' of ' + n + ' · ' + esc(steps[move.stage].t)) +
      '</span><span>' + pct + '</span></div><div class="bar"><span style="width:' + pct + '"></span></div></div>' +
      '<ol class="timeline">' + steps.map(function (st, i) { return stepItem(st, i, n); }).join('') + '</ol>' +
      '</div>' +
      '<aside class="dash-side" aria-label="Your team and updates">' +
      '<div class="side-group"><span class="side-label">Your team</span>' + team + '</div>' +
      '<div class="side-group updates"><span class="side-label">Updates</span>' + updates + '</div>' +
      '<div class="note-box">' + icon('lightbulb') + ' Your tracker is saved on this device (ref ' + esc(move.ref) + '). ' +
      (move.sent === false ? '<strong>Preview mode:</strong> this move wasn’t sent to Properfy. ' : '') +
      'Questions? Email <a href="mailto:' + PF.config.contact.email + '">' + PF.config.contact.email + '</a> or call <a href="tel:' + PF.config.contact.phoneHref + '">' + PF.config.contact.phone + '</a>. ' +
      '<button type="button" class="link-btn" data-remove>' + (confirmRemove ? 'Tap again to remove it from this device' : 'Remove this move from this device') + '</button></div>' +
      '</aside>' +
      '</div>';
  }

  /* ── Actions ──────────────────────────────────────────────────────────── */

  function arrange(i, btn) {
    var st = PF.journeys[move.journey].steps[i];
    var errEl = PF.$('[data-step-error]', root);
    btn.disabled = true;
    errEl.innerHTML = '';
    PF.send('arrange', {
      ref: move.ref, service: st.service, step: st.t, name: move.name, email: move.email, phone: move.phone,
      journey: move.journey, address: move.address, postcode: move.postcode
    }).then(function () {
      move.arranged[i] = true;
      addUpdate('Asked Properfy to arrange: ' + st.service.toLowerCase() + '.');
      PF.saveMove(move);
      render();
      PF.toast(st.service + ' requested. We’ll be in touch within one working day.');
    }).catch(function () {
      btn.disabled = false;
      errEl.innerHTML = '<p class="flow-error" role="alert">' + icon('warning-circle') + '<span>That didn’t send. Check your connection and try again.</span></p>';
    });
  }

  function markDone(i) {
    var st = PF.journeys[move.journey].steps[i];
    move.stage = i + 1;
    addUpdate('Completed: ' + st.t + '.', true);
    PF.saveMove(move);
    render();
    PF.toast('“' + st.t + '” marked as done.');
  }

  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-arrange]');
    if (a) { arrange(Number(a.getAttribute('data-arrange')), a); return; }
    var dn = e.target.closest('[data-done]');
    if (dn) { markDone(Number(dn.getAttribute('data-done'))); return; }
    if (e.target.closest('[data-remove]')) {
      if (!confirmRemove) { confirmRemove = true; render(); return; }
      PF.store.remove(PF.config.storageKey);
      w.location.href = 'index.html';
    }
  });

  if (!move || !move.journey || !PF.journeys[move.journey]) {
    renderEmpty();
    return;
  }
  render();
  if (PF.params().new) {
    w.history.replaceState(null, '', 'move.html');
    var intros = Object.keys(move.team).some(function (k) { return move.team[k] === 'intro'; });
    PF.toast(intros ? 'Your move is set up. We’ll introduce your team within a working day.' : 'Your move is set up.');
  }
})(window, document);
