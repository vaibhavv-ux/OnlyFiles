// api/dodo-webhook.js
//
// Receives payment events from Dodo Payments and, only after verifying the
// request really came from Dodo, marks the paying user as Pro in Supabase.
// This is the piece that makes "Pro" unfakeable from the browser — nothing
// in OnlyFiles.html can set this flag; only this server function can,
// using the Supabase service_role key, which never ships to the client.
//
// Register this file's deployed URL (https://onlyfiles.in/api/dodo-webhook)
// as the webhook endpoint in your Dodo Payments dashboard.
//
// Required environment variables:
//   DODO_WEBHOOK_SECRET        the signing secret Dodo shows you when you
//                              create the webhook (looks like "whsec_...")
//   SUPABASE_URL               e.g. https://ldtyhmoxqatghifnjumk.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  the *service_role* key from Supabase
//                              Settings → API. This key bypasses Row Level
//                              Security by design — keep it OUT of any
//                              client-side file, it only belongs here.
//
// Signature verification follows the Standard Webhooks spec Dodo uses:
// https://github.com/standard-webhooks/standard-webhooks

const crypto = require('crypto');
const { checkRateLimit } = require('../lib/rateLimit');

// Rate limiting on this endpoint counts only FAILED verification attempts
// (missing headers, stale timestamp, bad signature) — 5 per 15 minutes per
// IP — never genuine, correctly-signed events from Dodo. A blanket limit
// on every request would risk 429-ing real payment confirmations during a
// sales spike or one of Dodo's own retry bursts, and signature
// verification (not a request counter) is what actually proves a request
// came from Dodo. This only throttles someone hammering the endpoint
// without a valid secret.
async function rejectAsInvalid(req, res, status, body) {
  const rateLimit = await checkRateLimit(req, 'webhook-invalid');
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many invalid requests from this address.' });
  }
  return res.status(status).json(body);
}

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on('data', function (chunk) { chunks.push(chunk); });
    req.on('end', function () { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

function verifySignature(webhookId, webhookTimestamp, rawBody, signatureHeader, secret) {
  // The secret looks like "whsec_<base64>" — strip the prefix, then
  // base64-decode it to get the raw HMAC key bytes.
  var secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  var signedContent = webhookId + '.' + webhookTimestamp + '.' + rawBody.toString('utf8');
  var expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  var expectedBuf = Buffer.from(expected);

  // The header can contain multiple space-delimited "v1,<signature>"
  // entries (Dodo rotates signing keys without downtime) — a match on any
  // one of them is a valid signature.
  var candidates = signatureHeader.split(' ').map(function (part) {
    var idx = part.indexOf(',');
    return idx === -1 ? '' : part.slice(idx + 1);
  }).filter(Boolean);

  return candidates.some(function (sig) {
    var sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expectedBuf.length) return false;
    try {
      return crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch (e) {
      return false;
    }
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  var webhookId = req.headers['webhook-id'];
  var webhookTimestamp = req.headers['webhook-timestamp'];
  var webhookSignature = req.headers['webhook-signature'];
  var secret = process.env.DODO_WEBHOOK_SECRET;
  var SUPABASE_URL = process.env.SUPABASE_URL;
  var SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return rejectAsInvalid(req, res, 400, { error: 'Missing webhook signature headers' });
  }
  if (!secret || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('dodo-webhook: missing required environment variables');
    return res.status(500).json({ error: 'Webhook receiver is not configured yet' });
  }

  // Reject stale requests — a 5 minute tolerance is generous but blocks a
  // captured request from being replayed hours or days later.
  var tsSeconds = parseInt(webhookTimestamp, 10);
  if (!tsSeconds || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
    return rejectAsInvalid(req, res, 400, { error: 'Webhook timestamp outside tolerance' });
  }

  var rawBody = await readRawBody(req);

  var valid = false;
  try {
    valid = verifySignature(webhookId, webhookTimestamp, rawBody, webhookSignature, secret);
  } catch (err) {
    console.error('dodo-webhook: error while verifying signature', err);
  }

  if (!valid) {
    // Do not process anything from a request that fails verification —
    // this is the check that stops someone from just POSTing a fake
    // "payment succeeded" event at this URL to unlock Pro for free.
    return rejectAsInvalid(req, res, 401, { error: 'Invalid signature' });
  }

  var event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  try {
    if (event.type === 'payment.succeeded') {
      var data = event.data || {};
      var userId = data.metadata && data.metadata.supabase_user_id;
      var paymentId = data.payment_id;

      var expectedProduct = process.env.DODO_PRODUCT_ID;
      if (expectedProduct && data.product_cart && Array.isArray(data.product_cart)) {
        var matchesProduct = data.product_cart.some(function(item) {
          return item.product_id === expectedProduct;
        });
        if (!matchesProduct) {
          console.warn('dodo-webhook: payment succeeded for a different product, skipping activation', paymentId);
          return res.status(200).json({ received: true, ignored: true });
        }
      }

      if (!userId) {
        console.error('dodo-webhook: payment.succeeded had no supabase_user_id in metadata', paymentId);
      } else {
        var upsertRes = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId), {
          method: 'PATCH',
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: 'Bearer ' + SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            pro: true,
            dodo_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          }),
        });
        if (!upsertRes.ok) {
          console.error('dodo-webhook: failed to update profile in Supabase', await upsertRes.text());
          // Return a failure status here (instead of swallowing it as a
          // 200) so Dodo's own webhook retry logic kicks in. A 200 tells
          // Dodo "delivered, don't retry" — if we said that while the
          // Supabase write actually failed, a customer could pay, the
          // event could get marked delivered, and Pro would silently never
          // unlock with nothing left to retrigger it.
          return res.status(502).json({ error: 'Failed to record payment — please retry.' });
        }
      }
    }
    // Other event types (refunds, disputes, subscription events, etc.) can
    // be handled here later the same way — verify first (already done
    // above), then branch on event.type.
  } catch (err) {
    console.error('dodo-webhook: error while processing verified event', err);
    return res.status(500).json({ error: 'Internal error while processing event — please retry.' });
  }

  // Only acknowledge success once the Pro flag (when applicable) has
  // actually been written — see the early returns above for failure paths,
  // which deliberately leave Dodo free to retry.
  return res.status(200).json({ received: true });
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
