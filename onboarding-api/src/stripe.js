// Stripe Checkout and webhook verification using Stripe's REST API directly.

const form = (obj, prefix = '', out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === 'object') form(v, key, out);
    else if (v !== undefined) out.append(key, String(v));
  }
  return out;
};

export async function createCheckoutSession(env, rec, urls) {
  const body = form({
    mode: 'payment',
    customer_email: rec.client_email,
    client_reference_id: rec.id,
    line_items: { 0: { quantity: 1, price_data: { currency: 'gbp', unit_amount: rec.amount_pence, product_data: { name: `Initial payment on account – ${rec.transaction_label}`, description: `Property postcode ${rec.property_postcode} · Reference ${rec.id}` } } } },
    metadata: { onboarding_id: rec.id, transaction: rec.transaction_type, postcode: rec.property_postcode },
    payment_intent_data: { description: `Properfy ${rec.transaction_label} · ${rec.id}`, metadata: { onboarding_id: rec.id } },
    success_url: urls.success,
    cancel_url: urls.cancel
  });
  const res = await fetch(`${env.STRIPE_API_BASE}/v1/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `${rec.id}-${Date.now()}` },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error('Stripe checkout failed: ' + (data.error && data.error.message || res.status));
  return data;
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

// Verifies the Stripe-Signature header (HMAC-SHA256 of "timestamp.payload").
export async function verifyStripeSignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const v1 = [];
  let t = null;
  for (const item of header.split(',')) {
    const [k, v] = item.split('=');
    if (k === 't') t = v;
    if (k === 'v1') v1.push(v);
  }
  if (!t || !v1.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  return v1.some((sig) => safeEqual(sig, expected));
}
