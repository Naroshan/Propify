// Local stand-ins for Stripe and Resend, used by the tests.
//   POST /v1/checkout/sessions   create a checkout session (like Stripe)
//   GET  /checkout/:id           a fake checkout page with Pay / Cancel buttons
//   POST /checkout/:id/pay       sends a correctly signed webhook to the API, then returns to success_url
//   POST /checkout/:id/cancel    returns to cancel_url
//   POST /emails                 captures an email (like Resend)
//   GET  /_state                 everything captured, for assertions
import http from 'node:http';
import crypto from 'node:crypto';

export function signWebhook(payload, secret, t = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

export function checkoutCompletedEvent(session, overrides = {}) {
  return {
    id: 'evt_test_' + crypto.randomBytes(8).toString('hex'),
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: {
      id: session.id, object: 'checkout.session', client_reference_id: session.client_reference_id,
      metadata: session.metadata, payment_status: 'paid', amount_total: session.amount_total, currency: session.currency,
      payment_intent: 'pi_test_' + crypto.randomBytes(6).toString('hex'), ...overrides
    } }
  };
}

export function startMocks({ port, workerUrl, webhookSecret, stripeKey, resendKey }) {
  const state = { sessions: {}, stripeCalls: [], emails: [], webhooks: [] };
  const send = (res, status, body, type = 'application/json') => {
    res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
    res.end(type === 'application/json' ? JSON.stringify(body) : body);
  };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const body = await new Promise((r) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => r(b)); });
    const m = url.pathname.match(/^\/checkout\/(cs_test_[a-f0-9]+)(\/pay|\/cancel)?$/);

    if (req.method === 'POST' && url.pathname === '/v1/checkout/sessions') {
      if (req.headers.authorization !== `Bearer ${stripeKey}`) return send(res, 401, { error: { message: 'Invalid API key' } });
      const f = new URLSearchParams(body);
      const id = 'cs_test_' + crypto.randomBytes(8).toString('hex');
      const session = {
        id, url: `http://127.0.0.1:${port}/checkout/${id}`,
        amount_total: Number(f.get('line_items[0][price_data][unit_amount]')), currency: f.get('line_items[0][price_data][currency]'),
        client_reference_id: f.get('client_reference_id'), metadata: { onboarding_id: f.get('metadata[onboarding_id]') },
        success_url: f.get('success_url'), cancel_url: f.get('cancel_url'), customer_email: f.get('customer_email'),
        product: f.get('line_items[0][price_data][product_data][name]'), mode: f.get('mode')
      };
      state.sessions[id] = session;
      state.stripeCalls.push(session);
      return send(res, 200, { id, object: 'checkout.session', url: session.url });
    }
    if (m && req.method === 'GET' && !m[2]) {
      const s = state.sessions[m[1]];
      if (!s) return send(res, 404, 'No such session', 'text/plain');
      return send(res, 200, `<!DOCTYPE html><html><head><title>Mock Stripe Checkout</title></head><body style="font-family:sans-serif;padding:40px">
        <h1>Mock Stripe Checkout</h1><p data-amount>${(s.amount_total / 100).toFixed(2)} ${s.currency.toUpperCase()}</p><p data-product>${s.product}</p><p data-email>${s.customer_email}</p>
        <form method="post" action="/checkout/${s.id}/pay"><button id="pay">Pay</button></form>
        <form method="post" action="/checkout/${s.id}/cancel"><button id="cancel">Cancel</button></form></body></html>`, 'text/html');
    }
    if (m && req.method === 'POST' && m[2] === '/pay') {
      const s = state.sessions[m[1]];
      const payload = JSON.stringify(checkoutCompletedEvent(s));
      const r = await fetch(`${workerUrl}/api/stripe/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signWebhook(payload, webhookSecret) }, body: payload });
      state.webhooks.push({ session: s.id, status: r.status, body: await r.text() });
      res.writeHead(303, { Location: s.success_url });
      return res.end();
    }
    if (m && req.method === 'POST' && m[2] === '/cancel') {
      res.writeHead(303, { Location: state.sessions[m[1]].cancel_url });
      return res.end();
    }
    if (req.method === 'POST' && url.pathname === '/emails') {
      if (req.headers.authorization !== `Bearer ${resendKey}`) return send(res, 401, { message: 'Invalid API key' });
      const email = JSON.parse(body);
      state.emails.push(email);
      return send(res, 200, { id: 'email_' + state.emails.length });
    }
    if (url.pathname === '/_state') return send(res, 200, state);
    return send(res, 404, { error: 'not found' });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, state })));
}
