// Sends email through Resend (resend.com). Attachments are base64.
export async function sendEmail(env, { to, subject, html, text, attachments, replyTo }) {
  const res = await fetch(`${env.RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html, text, reply_to: replyTo, attachments })
  });
  if (!res.ok) throw new Error('Email failed: ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json().catch(() => ({}));
}

export const toBase64 = (bytes) => {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 0x8000) bin += String.fromCharCode.apply(null, arr.subarray(i, i + 0x8000));
  return btoa(bin);
};
