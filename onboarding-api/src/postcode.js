// England and Wales only: the same rule the website's forms use.
const OUTSIDE = {
  'Scotland': ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'],
  'Northern Ireland': ['BT'],
  'the Channel Islands': ['GY', 'JE'],
  'the Isle of Man': ['IM']
};
// TD (Scottish Borders) districts that include English addresses.
const ALLOW_DISTRICTS = ['TD12', 'TD15'];

export function checkPostcode(raw) {
  const pc = String(raw || '').toUpperCase().replace(/\s+/g, '');
  const m = pc.match(/^([A-Z]{1,2})(\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (!m) return { ok: false, message: 'Please add the full property postcode, for example E8 3PL.' };
  const district = m[1] + m[2];
  if (!ALLOW_DISTRICTS.includes(district)) {
    for (const region in OUTSIDE) {
      if (OUTSIDE[region].includes(m[1])) return { ok: false, message: `Sorry, Properfy only covers England and Wales, so we can’t help with ${region}.` };
    }
  }
  return { ok: true, postcode: district + ' ' + m[3] };
}
