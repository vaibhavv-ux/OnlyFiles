// api/create-checkout.js
//
// Creates a Dodo Payments checkout session for the currently signed-in
// user and returns the hosted checkout URL for the browser to redirect to.
//
// SECURITY NOTES (read before deploying):
// - DODO_API_KEY is your Dodo *secret* API key. It must only ever be set
//   as a Vercel environment variable, never written into OnlyFiles.html
//   or any other client-side file.
// - The user is identified by asking Supabase to verify the access token
//   the browser sends us, rather than trusting a user id the browser
//   claims to be. This is what stops someone from creating a checkout
//   "for" a different account than the one they're actually signed into.
//
// Required environment variables (set in Vercel → Project → Settings →
// Environment Variables):
//   SUPABASE_URL            e.g. https://ldtyhmoxqatghifnjumk.supabase.co
//   SUPABASE_ANON_KEY       the same publishable anon key used in the site
//   DODO_API_KEY            your Dodo secret API key
//   DODO_PRODUCT_ID         the product id for "OnlyFiles Pro" in Dodo
//   DODO_API_BASE           optional — defaults to live mode, set to
//                           https://test.dodopayments.com while testing
//   APP_URL                 optional — defaults to https://onlyfiles.in.
//                           Where Dodo sends the browser back after payment.
//                           Deliberately NOT read from the request's Origin
//                           or Host headers: those can be set to anything by
//                           a non-browser client calling this endpoint
//                           directly, which would let someone redirect their
//                           own post-payment return trip to an arbitrary
//                           domain. Hardcoding it here removes that option.
//
// Rate limiting: 5 attempts per 15 minutes per IP address (see
// ../lib/rateLimit.js). This runs before anything else in the handler, so
// a burst of requests never reaches Supabase or Dodo at all.

const { checkRateLimit } = require('../lib/rateLimit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = await checkRateLimit(req, 'checkout');
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many checkout attempts — please wait a few minutes and try again.' });
  }

  const authHeader = req.headers['authorization'] || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return res.status(401).json({ error: 'Sign in first, then try again.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const DODO_API_KEY = process.env.DODO_API_KEY;
  const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID;
  const DODO_API_BASE = process.env.DODO_API_BASE || 'https://live.dodopayments.com';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DODO_API_KEY || !DODO_PRODUCT_ID) {
    console.error('create-checkout: missing one or more required environment variables');
    return res.status(500).json({ error: 'Checkout isn’t configured yet on the server.' });
  }

  // Ask Supabase who this access token actually belongs to. Never trust a
  // user id the client sends directly in the request body.
  let user;
  try {
    const userRes = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Your session has expired — sign in again.' });
    }
    user = await userRes.json();
  } catch (err) {
    console.error('create-checkout: failed to verify session with Supabase', err);
    return res.status(502).json({ error: 'Could not verify your session right now.' });
  }

  if (!user || !user.id) {
    return res.status(401).json({ error: 'Your session has expired — sign in again.' });
  }

  // Hardcoded, not derived from req.headers.origin/host — see APP_URL note
  // above.
  const origin = process.env.APP_URL || 'https://onlyfiles.in';

  // Parse optional discount code from body
  let discountCode = '';
  if (req.body && typeof req.body === 'object' && req.body.discount_code) {
    discountCode = String(req.body.discount_code).trim().toUpperCase();
  } else if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && parsed.discount_code) {
        discountCode = String(parsed.discount_code).trim().toUpperCase();
      }
    } catch (e) {}
  }

  const checkoutPayload = {
    product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
    customer: user.email ? { email: user.email } : undefined,
    feature_flags: {
      allow_discount_code: true,
    },
    // This is what lets the webhook know which Supabase user to unlock —
    // it comes back verbatim on the payment.succeeded event.
    metadata: { supabase_user_id: user.id },
    return_url: origin + '/?checkout=success',
  };

  if (discountCode) {
    checkoutPayload.discount_codes = [discountCode];
  }

  try {
    const dodoRes = await fetch(DODO_API_BASE + '/checkouts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + DODO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const dodoData = await dodoRes.json().catch(function () { return {}; });

    if (!dodoRes.ok || !dodoData.checkout_url) {
      console.error('create-checkout: Dodo API returned an error', dodoRes.status, dodoData);
      return res.status(502).json({ error: 'Could not start checkout — try again shortly.' });
    }

    return res.status(200).json({ checkout_url: dodoData.checkout_url });
  } catch (err) {
    console.error('create-checkout: request to Dodo Payments failed', err);
    return res.status(502).json({ error: 'Could not reach the payment provider.' });
  }
}
