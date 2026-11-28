# Google sign-in and account isolation

## Runtime behavior

Save Here now offers Google OAuth as the fast path and keeps the existing magic-link form as a fallback. Both flows create a Supabase Auth session. The library is rendered only after `getSession()` resolves, and Supabase RLS remains the authorization boundary: item queries return rows owned by the authenticated `auth.uid()` only.

The OAuth redirect is the current site origin, so the same build works on production and local development without embedding a credential. The browser bundle contains only the Supabase publishable/anon key; service-role credentials remain server-only.

## Supabase and Google setup

1. In Google Cloud Console, configure the OAuth consent screen with the app name **Save Here**, the account type appropriate for this private app, and the `openid`, `email`, and `profile` scopes.
2. Create a **Web application** OAuth client.
3. Add these authorized JavaScript origins:
   - `https://save-here.vercel.app`
   - `http://localhost:3000` (development only)
4. In Supabase Auth → Providers → Google, enable Google and paste the Google Client ID and Client Secret.
5. Copy the Supabase Google callback URL shown on that provider page into Google’s authorized redirect URIs. It will look like:
   `https://jwsltuimjcipdhcvlovs.supabase.co/auth/v1/callback`
6. In Supabase Auth → URL Configuration, keep:
   - Site URL: `https://save-here.vercel.app`
   - Redirect allow-list: `https://save-here.vercel.app/**` and `http://localhost:3000/**`
7. Redeploy after changing provider settings. Do not put the Google secret, Supabase service-role key, or capture pepper in GitHub or any `NEXT_PUBLIC_` variable.

## Backward compatibility

If Google is disabled, misconfigured, blocked by a popup, or returns an OAuth error, the user can still use the email magic-link form. Existing magic-link accounts and saved items are unchanged. Google users are keyed by their Supabase Auth user ID; the existing RLS policies keep account data isolated.

## Verification

Run from this project directory:

```powershell
pnpm eval:auth
pnpm eval:recall
pnpm eval:evidence
pnpm check
```

The automated auth evaluation checks that Google OAuth, current-origin redirects, session listeners, magic-link fallback, sign-out, authenticated user lookup, and client-side secret safety remain present. A real Google round-trip still requires the provider configuration above and must be tested once in production.
