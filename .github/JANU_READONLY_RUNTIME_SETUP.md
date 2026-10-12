# Janu Apps Script Source Inspector — Dedicated Read-Only Bootstrap

**Status: REVIEWED DESIGN / NOT ACTIVATED.** As of 2026-10-13 the inspector PR is draft, its GitHub Actions fixture checks pass, and *no real OAuth/project access has been demonstrated*. No production changes or messages are permitted.

## Why this is separate

The existing production deployer uses `JANU_CLASPRC_JSON`, which has broad Google permissions, and `clasp push/run`. Reusing that OAuth identity just to inspect source would violate least privilege. This inspector instead uses direct `GET https://script.googleapis.com/v1/projects/{scriptId}/content` with **only** `https://www.googleapis.com/auth/script.projects.readonly`. It does **not** call write APIs, execute functions, inspect triggers, or activate production workers.

## Owner-only setup needed once

1. In your own Google Cloud project/OAuth consent configuration, ensure the Apps Script API is enabled. Authorize an OAuth client as a Google identity **already permitted to read the target Apps Script project**. Request *only* `https://www.googleapis.com/auth/script.projects.readonly`, with offline access to receive a refresh token. Do not use default broad `clasp login` scopes. Do not grant unrelated Drive/Sheets/Gmail or Apps Script write scopes.
2. Store a JSON secret in **GitHub repository → Settings → Secrets and variables → Actions**, named `JANU_INSPECT_OAUTH_JSON`, with exactly the following object shape. Use actual values locally; **never place a real secret in GitHub source, CI logs, tracker cells or ChatGPT messages**:

   ```json
   {"client_id":"<OAUTH_CLIENT_ID>","client_secret":"<OAUTH_CLIENT_SECRET>","refresh_token":"<REFRESH_TOKEN>"}
   ```

3. The existing `JANU_CLASP_JSON` repository secret supplies **only the script ID** (project identity), not the production deployer OAuth credential. Confirm that it targets the intended project. If the account cannot access that project, the inspector must fail; do not increase scope merely to force a passing check.
4. Inspect the workflow changes and the auditor credential's actual Google consented scopes. Review repository Actions/artifact access, retention (30 days), OAuth secret rotation/revocation and the risk of source-derived hash output.
5. After that review, separately approve promotion of **PR #57 only**, which changes only `.github/**` and must not match the Apps Script CD push path. In the repository Actions tab, manually dispatch **Janu Job Copilot Read-only Runtime Provenance** once. Do not dispatch the product CD workflow.
6. Verify that `assert-read-only` and the actual `inspect-runtime` jobs both pass. Download and compare the hash-only output to the private `__Worker State.deployment_source_sha256` and GitHub production-deployment manifest for the same stated release/version. Record exact run ID and observation time privately. Only then consider scheduling repeat captures.

## Exact data and boundaries

The inspector uses the OAuth refresh token to obtain a short-lived access token. It fails closed if the refreshed token's granted scope string is missing or differs from the **single read-only scope**. It retrieves Apps Script **editable project HEAD**, produces (1) the historical-comparable UTF-8 server-JS file hash and (2) a separate full-project hash covering server JS, HTML and Apps Script JSON manifest files, with deterministic file ordering; it emits: timestamp, inspector commit, source SHA-256, file count, release/suite extracted from source, OAuth scope assertion, target type and explicit non-execution markers. It does **not** retain token or source bodies as artifacts.

This is a **snapshot of editable project HEAD**. A project can also have separately *versioned deployments*; HEAD equality alone does not prove which code is serving an API executable/web app. Compare versioned deployment identity separately when needed. The offline test does not prove the direct API hash is byte-identical to the older `clasp pull` manifest representation; if a mismatch occurs, diagnose newline/name normalization before inferring code drift.

## Fail-closed cases

Missing secret, missing scope attestation, broader OAuth scope, wrong project ID, HTTP/auth failure, no server JS files, duplicate file names, missing release/suite identity or malformed content must fail. Never retry using `JANU_CLASPRC_JSON` or another write-capable identity.

- If OAuth consent, secret setup or repo admin operations are inaccessible to the assistant, **report the precise owner-only step**; never fabricate a token or request that it be pasted into chat.
- If a read succeeds but SHA differs from the private baseline, treat the result as **DRIFT SUSPECTED / NOT YET ATTRIBUTED**, preserve both source refs, and investigate before production changes.
- Apps Script **trigger inventory and trigger owner/cadence** remain a separate, currently unverified read-only surface.
- Do not claim end-to-end application success from a successful source read.

References: https://developers.google.com/apps-script/api/reference/rest/v1/projects/getContent and https://developers.google.com/identity/protocols/oauth2/native-app.
