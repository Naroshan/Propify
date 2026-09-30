/*
  Properfy — For partners (partners.html)
  Partner enquiries are emailed to Properfy. Firms must be in England or Wales.
*/
(function (w) {
  'use strict';

  var PF = w.PF;
  var icon = PF.icon;
  var esc = PF.esc;

  var form = PF.$('[data-partner-form]');
  if (!form) return;

  var errorEl = PF.$('[data-error]', form);

  function fail(field, msg) {
    errorEl.innerHTML = icon('warning-circle') + '<span>' + esc(msg) + '</span>';
    errorEl.hidden = false;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = form.elements;
    PF.$$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    errorEl.hidden = true;

    var p = {
      name: el.name.value.trim(),
      firm: el.firm.value.trim(),
      role: el.role.value,
      email: el.email.value.trim(),
      phone: el.phone.value.trim(),
      postcode: el.postcode.value.trim(),
      message: el.message.value.trim(),
      _honey: el._honey.value
    };

    if (!p.name) return fail(el.name, 'Add your name.');
    if (!p.firm) return fail(el.firm, 'Add your firm’s name.');
    if (!PF.validEmail(p.email)) return fail(el.email, 'That email doesn’t look right.');
    if (p.phone && !PF.validUkPhone(p.phone)) return fail(el.phone, 'Use a UK phone number, for example 020 7946 0000.');
    var area = PF.checkPostcode(p.postcode);
    if (!area.ok) return fail(el.postcode, area.message);
    p.postcode = area.postcode;

    var btn = PF.$('[type="submit"]', form);
    btn.disabled = true;
    btn.textContent = 'Sending…';

    PF.send('partner', p).then(function (res) {
      form.outerHTML =
        '<div class="success" role="status">' + icon('check-circle-fill') + '<div><strong>Thanks, ' + esc(p.name.split(' ')[0]) + '.</strong>' +
        (res.sent ? 'We’ll be in touch about partner access soon.' : 'Preview mode: this enquiry wasn’t sent.') + '</div></div>';
    }).catch(function () {
      btn.disabled = false;
      btn.innerHTML = 'Register interest' + icon('arrow-right');
      errorEl.innerHTML = icon('warning-circle') + '<span>That didn’t send. Check your connection and try again.</span>';
      errorEl.hidden = false;
    });
  });
})(window);
