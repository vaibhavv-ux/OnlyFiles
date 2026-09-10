# OnlyFiles Security Audit

Last updated: September 10, 2026. This is a full re-audit covering everything that exists now: the 16 client-side tools, Supabase auth, the `profiles`/Pro-status backend, the two Vercel payment functions, the new rate limiting, and a live check of the actual Supabase project (`ldtyhmoxqatghifnjumk`) via the Supabase connector. Earlier rounds covered the frontend and a first pass of Supabase; this round adds the payment backend and closes out a few things that were previously just recommendations.

## Bottom line

Nothing found in this pass is exploitable in a way that lets someone steal a file, another user's data, or Pro access without paying. Two real (low-to-medium severity) issues were found and fixed during this audit — a post-payment redirect that trusted a spoofable header, and a webhook failure mode that could silently lose a paid unlock. Everything else that remains open requires action in the Supabase or Dodo dashboards, not code, because I don't have write access to either from here.

## Fixed during this audit

**Post-payment redirect trusted a client-controllable header (low severity, fixed).** `create-checkout.js` built the URL Dodo redirects the browser back to after payment from `req.headers.origin` / `req.headers.host`. Those are normal HTTP headers — a real browser sets `Origin` reliably, but anyone hitting the endpoint directly with `curl` or similar (using their own valid sign-in token — this isn't accessible to a stranger) could set it to anything. The realistic impact was limited to someone redirecting their own post-payment return trip, since an attacker only has their own access token, not another user's — but there's no reason to leave a redirect target under the client's control at all. Fixed by hardcoding it to `https://onlyfiles.in` (overridable via an `APP_URL` env var if you ever run a staging environment).

**A failed Supabase write during the webhook was silently treated as success (medium severity for reliability, fixed).** If `dodo-webhook.js` received a valid, correctly-signed payment event but the follow-up write to Supabase failed for any reason (network hiccup, wrong service-role key, Supabase being briefly unavailable), the function still returned `200 OK` to Dodo. A `200` tells Dodo "delivered, don't retry" — so a customer could genuinely pay, the event could get marked as handled, and the `pro` flag would just never get set, with nothing left to automatically retry it. Fixed: a failed write (or any unexpected error while processing an already-verified event) now returns a `5xx`, which puts it back into Dodo's normal webhook retry queue instead of disappearing.

**RLS policy performance (not a vulnerability, fixed while in there).** Supabase's own advisor flagged that `profiles_select_own`'s `auth.uid() = id` check gets re-evaluated per row instead of once per query — fine at 2 rows, needlessly slow at scale. Rewrote it as `(select auth.uid()) = id`. Re-ran the advisor after: the warning is gone, nothing else changed.

## What I checked directly in the two Vercel functions

**Authentication is server-verified, not client-asserted.** `create-checkout.js` never trusts a user id the browser sends — it takes the bearer token and asks Supabase's own `/auth/v1/user` endpoint whose token it actually is. That's what stops someone from creating a checkout "for" a different account.

**The webhook cannot be forged.** `dodo-webhook.js` verifies Dodo's HMAC-SHA256 signature (Standard Webhooks spec: `webhook-id.webhook-timestamp.rawBody`, constant-time comparison via `crypto.timingSafeEqual`, a 5-minute timestamp tolerance to block replay) before it does anything else, using a secret that only exists as a Vercel environment variable. Nothing about "Pro" can be set without that secret. I also confirmed the `service_role` key used to write `pro=true` never appears anywhere except `process.env.SUPABASE_SERVICE_ROLE_KEY` — grepped both files and the whole rest of the codebase for a hardcoded value; found none (see the scan I ran earlier this session).

**IP-based rate limiting is trustworthy, not spoofable.** I checked this rather than assumed it: I looked it up directly against Vercel's current documentation. Vercel's edge overwrites the `x-forwarded-for` header on every request and explicitly does not forward a client-supplied value — "this restriction is in place to prevent IP spoofing," in their words. So `rateLimit.js` reading `x-forwarded-for` is safe on Vercel by default; there's no untrusted proxy chain to worry about unless you later put another CDN in front of Vercel yourself, which you're not doing.

**No unbounded request body / memory exhaustion risk.** `dodo-webhook.js` reads the raw request body manually (required for signature verification) with no size cap in the code itself — I flagged this as a possible concern, then checked Vercel's platform limits directly rather than guess: Vercel enforces a hard 4.5 MB request body cap at the infrastructure level, before your function code ever runs, regardless of `bodyParser` settings. A larger request gets rejected with `413` by Vercel itself. So this isn't actually an open DoS vector — confirmed, not assumed.

**CSRF doesn't apply.** Both functions authenticate via a bearer token / signature the caller must already possess, not an ambient cookie a browser attaches automatically — there's no cross-site request to forge.

**No secrets in error responses.** Every failure path returns a short generic message to the caller; the actual detail (Supabase/Dodo response bodies, stack context) only goes to `console.error`, which lands in Vercel's function logs, not the HTTP response.

## Live Supabase project check (this pass)

- **Security advisor**, after this round's fixes: one pre-existing item remains open (leaked password protection, below), one is a false alarm explained below, and one is expected/intentional. No new issues from anything built this session.
- **`rls_auto_enable()` flagged as "publicly executable" — investigated, not actually exploitable.** The advisor flags this as a `SECURITY DEFINER` function callable by anyone via `/rest/v1/rpc/rls_auto_enable`. I pulled its actual definition from Postgres rather than take the generic warning at face value: it's declared `RETURNS event_trigger`, which means Postgres only lets it run automatically in response to a `CREATE TABLE` event — calling it directly via RPC, as the advisory implies is possible, actually errors out at the database level ("event trigger functions can only be called as event triggers"). It's Supabase's own platform-managed function for auto-enabling RLS on new tables, not something I created, and not something you need to act on.
- **`public.rate_limit_hits` shows "RLS enabled, no policy" — intentional, not a gap.** This is the same pattern used for `profiles`: RLS on with zero policies for `anon`/`authenticated` means those roles get zero access, and only the `service_role` key (which bypasses RLS entirely) can read or write it. That's correct for a table nobody's browser should ever touch.
- **`public.profiles`**: RLS enabled, 1 select policy (`profiles_select_own`, now optimized), no insert/update/delete policy for any non-service-role — meaning `pro` can only ever be set by the webhook function, never by anything running in a browser. 2 rows, matching your 2 real accounts.
- **Storage**: still zero buckets. Nothing to misconfigure yet.
- **No stray custom functions, no unexpected extensions, no second/mismatched API key** — the publishable key returned by the project still matches exactly what's embedded in the site.

## Still open — needs a dashboard, not code

These all require clicking something in the Supabase or Dodo dashboard. I don't have a tool that can do them for you, so I can't close them from here — but they're quick.

1. **Leaked Password Protection is still disabled** (Supabase → Authentication → Policies). Two clicks; checks new passwords against HaveIBeenPwned at signup/sign-in.
2. **CAPTCHA on sign-in/sign-up isn't enabled.** I checked Supabase's actual current rate-limit config options for you last turn — their dashboard doesn't expose a literal "N attempts per 15 minutes" control for password sign-in the way you asked for on the payment endpoints. The real lever they offer for brute-force protection there is CAPTCHA (hCaptcha or Cloudflare Turnstile), configured from the same Authentication settings page. I can wire the widget into the sign-in/sign-up forms in OnlyFiles.html if you want to move on this.
3. **Auth → URL Configuration allowlist** — confirm it only contains `onlyfiles.in` (plus your local dev URL if you use one), not a wildcard. I have no tool that can read this setting.
4. **Once you actually get a Dodo account**: the webhook secret, product ID, and API key still need to go into Vercel's environment variables — none of the payment code can do anything real until those exist. Covered in detail in our earlier messages.

## New this round: security headers

A static HTML file can't set response headers from inside itself — that has to happen at the hosting layer. Now that a Vercel deployment is concrete (not hypothetical), I wrote `vercel.json` with a real header set: Content-Security-Policy (scoped to exactly the CDNs and the Supabase project your site actually calls — `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, Google Fonts, your Supabase URL — nothing wide open), `X-Frame-Options: DENY` and `frame-ancestors 'none'` (blocks clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. This file needs to sit at the root of your actual Vercel project, next to `index.html` and the `api/` folder — it won't do anything sitting on its own.

## Structurally not applicable (recap from earlier rounds, still true)

Your file tools have no server to attack — every compress/convert/merge/encrypt/watermark/scrub operation runs in the visitor's own browser via Canvas, Web Crypto, and pdf-lib, and files are never uploaded anywhere. That rules out insecure file uploads, SSRF, and direct SQL/NoSQL injection as concerns for this codebase — there's no code path where any of those could occur. Full reasoning for each is in the original audit if you want it again; it hasn't changed.

## Contact / ownership note

Everything above reflects the code and live infrastructure state as of this audit. If you add anything new — another table, another serverless function, another third-party integration — treat it as needing the same pass: RLS on from the first migration, secrets only as environment variables, server-side verification of anything a browser claims about itself.
