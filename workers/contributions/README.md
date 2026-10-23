# livebio contribution service

A tiny edge function that lets the livebio builder show **contribution data** (the activity graph and streaks) in its preview without anyone logging in.

GitHub only gives contribution data to callers with a token, and a web page cannot hold a secret. So this Worker holds a read-only token for you and passes on only public data.

You only need to deploy it if you host your own copy of the builder. **Profiles that use the Action do not need it**, because the Action reads contributions itself.

## What it does and does not do

- `GET /?user=<login>` returns JSON: `days` (date, count, level) plus totals and streaks.
- It stores **nothing** except a one-hour cache of public data. No accounts, no logs of who asked for whom, no cookies.
- It is read-only. The token needs no permissions at all.
- Cross-origin access is limited to the sites listed in `ALLOWED_ORIGINS`.
- Errors are deliberately vague. The token never appears in a response.

| Result | Meaning |
|---|---|
| `200` | Data, cached for an hour |
| `400` | Not a valid GitHub username |
| `404` | No such user (cached for ten minutes) |
| `503` + `Retry-After` | GitHub's rate limit was reached. Nothing is cached |
| `502` | GitHub could not be reached or sent something unexpected |
| `500` | The service is not set up correctly (missing or rejected token) |

When the service is down or limited, the builder just leaves the activity section out of the preview. The Action is not affected.

## Deploy it

You need a free [Cloudflare](https://dash.cloudflare.com/sign-up) account. The free plan is enough.

**1. Make a token.** On GitHub: Settings, Developer settings, Personal access tokens, **Tokens (classic)**, Generate new token. **Tick no scopes at all.** It only needs to read public data. Choose a long expiry and put a reminder in your calendar, because the service stops showing activity the day it expires.

**2. Deploy.** From this folder:

```
npx wrangler login
npx wrangler secret put GITHUB_TOKEN     # paste the token when asked
npx wrangler deploy
```

Wrangler prints an address like `https://livebio-contributions.<you>.workers.dev`.

**3. Check it.** The first call can take a second:

```
curl "https://livebio-contributions.<you>.workers.dev/?user=octocat"
```

You should see JSON with a `days` list. A second call should return `X-Livebio-Cache: HIT` in the headers.

**4. Tell the site.** In your repository, Settings, Secrets and variables, Actions, **Variables** tab, add a variable named `CONTRIBUTIONS_URL` with the address from step 2. Then re-run the "Deploy site" workflow. The builder now shows the activity section in its preview.

**5. Recommended: add a rate limit.** In the Cloudflare dashboard, Security, WAF, Rate limiting rules, add a rule that allows roughly 30 requests per minute per IP address. Caching already protects the token for repeated lookups, but a rule stops someone from cycling through thousands of different usernames.

## Limits to know about

- GitHub allows a token about 5,000 GraphQL points an hour. One lookup costs about one point, and each user is cached for an hour, so normal traffic is far below that. If it is ever exceeded, the service answers `503` until the hour resets.
- Cloudflare's free plan allows 100,000 requests a day.
- GitHub's calendar shows what GitHub shows publicly. Private contributions appear only if that user has chosen to show them.

## Develop

```
npm test -w @livebio/worker        # unit tests
npm run dev -w @livebio/worker     # run locally in the Cloudflare runtime
```

For local runs, create `.dev.vars` in this folder (it is ignored by git) containing `GITHUB_TOKEN=...`.
