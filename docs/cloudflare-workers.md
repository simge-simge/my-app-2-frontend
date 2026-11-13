# Deploy CommonShelf to Cloudflare Workers

The frontend is an Expo static web export. Cloudflare Workers Static Assets hosts `dist/`;
the FastAPI backend and Supabase remain on their existing services.
`wrangler.jsonc` configures the existing Worker `my-app-2-frontend`. No Worker
JavaScript entry point is needed for this static-assets deployment.

## 1. Connect the frontend repository

Commit and push these frontend changes to your Git provider. In Cloudflare,
open **Workers & Pages > my-app-2-frontend > Settings > Build** and connect
the frontend repository if it is not already connected. Choose these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Leave empty for the standalone frontend repository |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview builds | Disable for the separate staging Worker workflow |

The Worker name must match `name` in `wrangler.jsonc`. The asset directory is
configured there as `./dist`; there is no Pages output-directory field to set.

This workspace contains separate frontend and backend Git repositories. If you
later combine them into one repository, set the root directory to `frontend`.
The committed `.node-version` selects Node.js 22, matching frontend CI.
Cloudflare installs dependencies using `package-lock.json` before building.

Use the existing Worker; creating a Pages project is unnecessary.

For testing in the cloud before production, follow [the staging guide](staging.md).
It connects a separate Worker to the `staging` branch while `main` controls
production. Configure branch controls in Cloudflare before pushing changes.

## 2. Set build environment variables

Configure these under the Worker's **Settings > Build > Variables and secrets**
(build variables, rather than only runtime bindings). Use your existing
production values, available in your local `.env.production` and Supabase:

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Existing public HTTPS FastAPI URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Existing Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase publishable or legacy anon key |
| `EXPO_PUBLIC_DISABLE_EMAIL_VERIFICATION` | `false` |

Check the build variables used by non-production branches if you enable them.
Expo embeds `EXPO_PUBLIC_*` values in the JavaScript at build time; rebuild after
changing them. Never use a Supabase secret/service-role key or backend Gemini
key here. Dashboard values override the committed Expo environment defaults.

Save and deploy. The production origin for this Worker is
`https://my-app-2-frontend.simgeeakgull29.workers.dev`.

## 3. Allow the new origin in the backend

On your existing backend hosting platform, update `CORS_ORIGINS` to include the
exact Worker origin (HTTPS, no path or trailing slash). During migration use:

```dotenv
CORS_ORIGINS=https://my-app-2-frontend.simgeeakgull29.workers.dev,https://commonshelf.expo.app,https://commonshelf--vzcyuywscq.expo.app
```

Keep any other origins you still use. Deploy the backend changes and restart
the service after updating its environment. The backend now uses the configured
allowlist without automatically adding the old EAS hostname. Keeping the old
hostname explicitly during migration lets the existing deployment keep working.

If you use a custom domain, add its exact origin too. Authenticated preview
deployments also need their exact origin allowed; `CORS_ORIGINS` does not parse
wildcards such as `*.workers.dev`. Prefer a stable preview URL or a
separate test backend rather than allowing every Cloudflare project.

## 4. Update Supabase Auth

In **Supabase > Authentication > URL Configuration**:

1. Set **Site URL** to the new production origin.
2. Add `https://my-app-2-frontend.simgeeakgull29.workers.dev/auth/callback` to **Redirect URLs**.
3. Keep `commonshelf://auth/callback` for mobile and any local URLs you use.
4. Keep the old EAS callback URL during the transition.

Add the corresponding callback URL for a custom domain or any authenticated
preview. The frontend already creates its callback from the current origin,
so it does not need a hardcoded Cloudflare URL. If custom email templates use
`SiteURL` instead of `RedirectTo`, review them when testing verification emails.

If Google sign-in is enabled, update the Google OAuth consent screen's app
homepage, privacy-policy, and terms links to the new domain as applicable. With
the existing Supabase OAuth flow, Google's authorized redirect URI remains the
Supabase `/auth/v1/callback` URL.

## 5. Verify before retiring EAS Hosting

- Open `/`, `/privacy`, `/terms`, and `/login` directly.
- Sign in, open an existing book, chat, match, and member page, then refresh
  each URL. Verify nested `/books/edit/<id>` as well.
- Test a new signup verification email and Google sign-in if enabled.
- Confirm authenticated API requests succeed without browser CORS errors.
- Test image upload and ISBN camera scanning over HTTPS.

The public homepage and legal pages retain Expo's static HTML output.
`public/_redirects` is copied into `dist/_redirects` by Expo and maps dynamic
URLs to the exported `[id].html` templates using internal rewrites. When adding
a new dynamic route, add its rewrite here. Keep `/books/new` and
`/books/shelf-scan` before `/books/:bookId` so those pages are not treated as IDs.

Only retire the old EAS deployment after these checks pass. Then remove the old
origin from backend CORS and the old callback from Supabase. Users may need to
sign in again because browser sessions are stored per origin. For a custom
domain, add it in the Worker's **Settings > Domains & Routes** and repeat the
CORS and Auth configuration for that origin before switching traffic.

## Local build

From the frontend directory:

```sh
npm ci
npm run build
```

To preview the exported site with Cloudflare's local asset routing:

```sh
npx wrangler dev
```

For a manual production deployment after testing, authenticate with
`npx wrangler login` and run `npx wrangler deploy` from the frontend directory.
Git-connected Workers Builds handles authentication and deployment in CI.

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of
`npm`. Upload the generated `dist` directory only; local environment files are
not deployment artifacts.

References: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/),
[Workers static assets](https://developers.cloudflare.com/workers/static-assets/),
[Workers redirects](https://developers.cloudflare.com/workers/static-assets/redirects/),
[Expo web deployment](https://docs.expo.dev/guides/publishing-websites/),
[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
