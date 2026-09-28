/*
  Properfy — icon set
  Simple 24px line icons. No houses, no keys.
  Usage: PF.icon('conveyancing') → '<svg …>'
*/
(function (w) {
  'use strict';

  var PF = (w.PF = w.PF || {});

  var PATHS = {
    // Goals
    pin: '<path d="M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.4"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    move: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/>',

    // Live services
    conveyancing: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4.5"/>',
    mortgage: '<circle cx="12" cy="12" r="9"/><path d="M14.6 8.6A2.6 2.6 0 0 0 10 10.2V16M8.5 16h7M8.5 12.6h4.6"/>',
    survey: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.6-4.6"/><path d="M8.3 11.2l1.9 1.9 3.5-3.6"/>',
    auctions: '<path d="M12 3l9 9-3 3-9-9z"/><path d="M13.5 10.5l-9 9"/><path d="M11 21h10"/>',
    removals: '<path d="M2 5.5h12V16H2z"/><path d="M14 9h4.5l3.5 3.5V16h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',

    // Coming soon
    insurance: '<path d="M12 3l8 3v6c0 4.6-3.4 8.4-8 9-4.6-.6-8-4.4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    utilities: '<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>',
    valuations: '<path d="M3 20h18"/><path d="M5 16v-4M9.5 16V8M14 16v-6M18.5 16V5"/>',
    epc: '<path d="M5 19c0-8.3 5.2-13.8 15-15-1.2 9.8-6.7 15-15 15z"/><path d="M5 19l7.5-7.5"/>',
    brokers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3a6.5 6.5 0 0 1 3.5 5.7"/>',
    bridging: '<path d="M2 16h20M4.5 16v4M19.5 16v4"/><path d="M2 12.5C5 12.5 7 8 12 8s7 4.5 10 4.5"/><path d="M8 9.6V16M12 8v8M16 9.6V16"/>',
    improvements: '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h1.5A1.5 1.5 0 0 1 21 7.5v2a1.5 1.5 0 0 1-1.5 1.5H12v3"/><rect x="10" y="14" width="4" height="7" rx="1"/>',
    storage: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>',
    cleaning: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    trades: '<path d="M15.5 3.5a5 5 0 0 0-4.8 6.4L3.6 17a2 2 0 0 0 2.8 2.8l7.1-7.1a5 5 0 0 0 6.4-4.8l-2.9 2.9-2.8-.7-.7-2.8z"/>',

    // Interface
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    star: '<path fill="currentColor" stroke="none" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.4 8.4-8 9-4.6-.6-8-4.4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8l1.4-2.2 4.5 1.5V18a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pound: '<path d="M16 7.2A3.6 3.6 0 0 0 9.5 9.4V18M7 18h10M7 13.5h6.5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'
  };

  PF.icon = function (name, cls) {
    var body = PATHS[name] || PATHS.sparkle;
    return (
      '<svg class="i i-' + name + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body +
      '</svg>'
    );
  };

  /*
    The Properfy mark: the letter that moves between f and t.
    Four strokes make the morph — the f's hook and foot retract while the
    t's top and hook draw in (see .ft-f / .ft-t in main.css).
  */
  var FT =
    '<g class="ft" fill="none" stroke-width="5">' +
    '<path d="M143 18.5h16"/>' +
    '<path d="M150 13.5v17"/>' +
    '<path class="ft-f" pathLength="1" d="M150 14.5v-2a8 8 0 0 1 8-8h2"/>' +
    '<path class="ft-f" pathLength="1" d="M150 29.5V40"/>' +
    '<path class="ft-t" pathLength="1" d="M150 14.5V8"/>' +
    '<path class="ft-t" pathLength="1" d="M150 29.5a8 8 0 0 0 8 8h2"/>' +
    '</g>';

  PF.FT_GLYPH = FT;

  PF.mark = function (cls) {
    return (
      '<svg class="mark' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<rect class="mark-bg" width="48" height="48" rx="14"/>' +
      '<g transform="translate(24 24) scale(.9) translate(-151.5 -21)">' + FT + '</g>' +
      '</svg>'
    );
  };
})(window);
