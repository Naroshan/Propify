/*
  Properfy — homepage
  "Pick your move": the journey tiles switch the step list and the start
  button. The page ships with the Buying steps in the HTML already.
*/
(function (w) {
  'use strict';

  var PF = w.PF;
  var esc = PF.esc;

  var tiles = PF.$('[data-journey-tiles]');
  var list = PF.$('[data-journey-steps]');
  var start = PF.$('[data-journey-start]');
  if (!tiles || !list || !start) return;

  PF.stepRows = function (key) {
    return PF.journeys[key].steps.map(function (s, i) {
      return (
        '<li class="step-row"><span class="step-num">' + PF.pad2(i + 1) + '</span>' +
        '<div class="step-main"><div class="step-text"><span class="step-title">' + esc(s.t) + '</span>' +
        '<span class="step-desc">' + esc(s.d) + '</span></div>' +
        '<div class="step-meta"><span class="step-time">' + esc(s.time) + '</span>' +
        (s.service ? '<span class="tag tag-outline">We arrange: ' + esc(s.service) + '</span>' : '') +
        '</div></div></li>'
      );
    }).join('');
  };

  tiles.addEventListener('click', function (e) {
    var tile = e.target.closest('[data-journey]');
    if (!tile) return;
    var key = tile.getAttribute('data-journey');
    PF.$$('[data-journey]', tiles).forEach(function (t) { t.setAttribute('aria-pressed', t === tile ? 'true' : 'false'); });
    list.innerHTML = PF.stepRows(key);
    start.href = 'start.html?journey=' + key;
    start.innerHTML = 'Start ' + PF.journeys[key].label.toLowerCase() + ' with Properfy' + PF.icon('arrow-right');
  });
})(window);
