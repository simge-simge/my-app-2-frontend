# Test in the cloud before releasing

Use two Workers connected to the same frontend repository. Cloudflare's Git
integration controls automatic deployments independently of GitHub Actions.
The existing GitHub Actions workflow only runs tests and builds.

| | Production | Staging |
| --- | --- | --- |
| Worker | `my-app-2-frontend` | `my-app-2-frontend-staging` |
| Git branch | `main` | `staging` |
| Build command | `npm run build` | `npm run build` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --config wrangler.staging.jsonc` |
| Wrangler file | `wrangler.jsonc` | `wrangler.staging.jsonc` |
| Domain | `commonshelf.club` | `my-app-2-frontend-staging.simgeeakgull29.workers.dev` |

The staging hostname above follows your existing account subdomain. Confirm the
actual hostname Cloudflare assigns. Both configurations publish the Expo export
in `dist`. The staging configuration has its own Worker name and no production
domain routes.

## Configure Cloudflare before relying on branch separation

For the existing production Worker, open **Settings > Build > Branch control**:

1. Set the production branch to `main`.
2. Disable **Enable Preview Builds** for this workflow.
3. Keep the production build/deploy commands shown above.

Create the `staging` branch in GitHub (or locally after saving your changes).
Create a second Worker named `my-app-2-frontend-staging` and connect the same
frontend repository. In its build settings:

1. Set the production branch to `staging`. Cloudflare calls the selected branch
   "production" for each Worker; this Worker's selected branch is staging.
2. Disable **Enable Preview Builds**.
3. Set the staging build/deploy commands from the table.
4. Leave the root directory empty for the standalone frontend repository.
5. Configure its own build variables before the first build.

Pushes to other branches will then only run the repository's GitHub Actions
checks. Pushes to `staging` update the staging Worker; pushes or merges to `main`
update the production Worker. The configuration files alone do not change
Cloudflare's branch controls: those dashboard settings are required.

If you want an explicit release even when pushing to `main`, disconnect the
production Worker's Git build integration and deploy production manually with
`npm run build` followed by `npx wrangler deploy`. Keep staging Git integration
enabled. The two-branch setup otherwise treats merging into `main` as release.

## Choose staging data

Set these under the staging Worker's **Settings > Build > Variables and secrets**:

- `EXPO_PUBLIC_API_URL`: your staging backend's HTTPS URL.
- `EXPO_PUBLIC_SUPABASE_URL`: your staging Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_KEY`: its publishable or anon key.
- `EXPO_PUBLIC_DISABLE_EMAIL_VERIFICATION`: `false`.

The staging backend must use that same Supabase project. Dashboard build values
override the committed `.env.production` defaults; Expo embeds them at build
time. If you reuse production API/Supabase values, staging actions change real
production data. A separate Worker isolates frontend releases, not the database.

For whichever backend staging uses, append the actual staging origin to
`CORS_ORIGINS`, for example:

```text
https://my-app-2-frontend-staging.simgeeakgull29.workers.dev
```

In the corresponding Supabase project's **Authentication > URL Configuration**,
add this Redirect URL:

```text
https://my-app-2-frontend-staging.simgeeakgull29.workers.dev/auth/callback
```

Keep the production Supabase Site URL as `https://commonshelf.club` if sharing
the project. For a separate staging Supabase project, use the staging origin
as its Site URL.

Optionally attach `staging.commonshelf.club` as a Custom Domain on the staging
Worker. Add `https://staging.commonshelf.club` to the appropriate backend CORS
list and `https://staging.commonshelf.club/auth/callback` to Supabase too.

## Daily workflow

1. Develop on a feature branch and open a pull request into `staging`.
2. Merge it after checks pass. Cloudflare publishes the staging frontend.
3. Test login, signup verification, API actions, and refreshing dynamic URLs.
4. Open a pull request from `staging` into `main` when ready to release.
5. Merge it. Cloudflare publishes the production frontend.

For a first local staging branch, save the pending repository changes, then:

```sh
git switch -c staging
git push -u origin staging
```

Commit the staging configuration and documentation before pushing. No remote
branch or Cloudflare Worker is created by merely adding these local files.
Avoid committing credentials or unrelated workspace artifacts.

References: [Cloudflare branch controls](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/),
[Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
