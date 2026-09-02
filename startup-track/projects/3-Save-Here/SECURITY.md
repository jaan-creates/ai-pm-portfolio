# Security policy

Save & Recall is a private single-owner application whose source code lives in a public portfolio repository. Production data and secrets are never public.

## Never store in the repository

- Passwords, recovery codes, API keys, bearer tokens, or session cookies.
- Instagram credentials or exported browser sessions.
- Real private screenshots, recordings, PDFs, or exports.
- Aadhaar, passport, financial, medical, intimate, client, or employer-confidential content.

## Reporting and response

Treat credential exposure, cross-owner access, or capture loss as P0. Revoke affected credentials, preserve redacted evidence, and open a Jira Bug linked to the remediation pull request.

Shortcut credentials are capture-only bearer tokens. The database stores an HMAC digest, never the plaintext token.

## Public-source release gate

Run `pnpm security:public` before every public push. CI rejects common credential formats, configured secret values, private-key files, personal home-directory paths, real media/data file types, and tracked files larger than 5 MiB. This is a guardrail, not permission to commit real owner content.
