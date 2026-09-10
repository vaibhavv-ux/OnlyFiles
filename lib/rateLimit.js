// lib/rateLimit.js
//
// Shared rate-limiting helper for the OnlyFiles Vercel functions.
//
// IMPORTANT: this file lives OUTSIDE the api/ folder on purpose. Vercel
// turns every file under api/ into its own public endpoint, so a shared
// helper needs to sit next to api/, not inside it, or it would (at best)
// fail to deploy as a function, and (at worst) become an unintended route.
//
// Vercel functions are stateless and can cold-start on any instance, so an
// in-memory counter here would not actually enforce a limit across
// requests. Instead this calls check_rate_limit(), a Postgres function
// (see supabase migration "add_rate_limiting") that atomically tracks a
// count per key in a table only the service_role key can touch. That
// table is the single shared source of truth every function instance
// reads and writes, so the limit holds no matter which instance handles
// a given request.

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated chain of proxies; the first
    // entry is the original client.
    return forwarded.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Checks and increments the counter for `bucket:ip` in one atomic call.
// Returns { allowed, retryAfterSeconds }. `bucket` scopes the limit to one
// endpoint/purpose (e.g. "checkout") so different endpoints don't share a
// counter for the same visitor.
async function checkRateLimit(req, bucket) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Misconfiguration shouldn't take the whole endpoint down — but it
    // needs to be loud in the logs, because it means rate limiting is
    // silently not happening.
    console.error('rateLimit: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — allowing request through unlimited');
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const key = bucket + ':' + getClientIp(req);

  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/check_rate_limit', {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: key,
        p_max_attempts: MAX_ATTEMPTS,
        p_window_seconds: WINDOW_SECONDS,
      }),
    });

    if (!res.ok) {
      console.error('rateLimit: check_rate_limit call failed', res.status, await res.text().catch(function () { return ''; }));
      // Fail open: a Supabase hiccup shouldn't take checkout/webhooks down
      // entirely. Rate limiting here is defense-in-depth, not the only
      // control (auth + signature verification stay in place regardless).
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const allowed = await res.json();
    return { allowed: allowed === true, retryAfterSeconds: WINDOW_SECONDS };
  } catch (err) {
    console.error('rateLimit: error calling check_rate_limit', err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

module.exports = { checkRateLimit, MAX_ATTEMPTS, WINDOW_SECONDS };
