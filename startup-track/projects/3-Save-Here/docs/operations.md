# Operations runbook

## Create the first owner

Create the single owner in Supabase Authentication. Copy the owner UUID; do not copy the password into the repository or chat.

## Create an iPhone capture token

1. Generate a 32-byte random token and a device UUID locally.
2. Compute `HMAC-SHA-256(token, CAPTURE_TOKEN_PEPPER)` as lowercase hexadecimal.
3. Insert only the digest:

```sql
insert into public.device_tokens(owner_id, device_id, device_name, token_hash)
values (
  '<owner uuid>',
  '<device uuid>',
  'Owner iPhone',
  '<64-character HMAC digest>'
);
```

Put the plaintext token and the same device UUID in the iPhone Shortcut. The token has capture scope only and can be revoked by setting `revoked_at = now()`.

## Expected degraded behavior

- Missing Supabase configuration: the interface loads, capture returns `service_not_configured`.
- Invalid or revoked token: capture returns 401 without revealing which credential check failed.
- AI/X/media disabled or exhausted: durable capture continues and jobs remain visible.
- Restricted Instagram source: item remains link-only and asks for user-provided evidence.

## Recording retention

Recordings default to `temporary` with `purge_after = created_at + interval '30 days'`. A worker deletes the object first, then marks the asset deleted. “Keep original” changes retention to `permanent` and clears `purge_after`.

## Pilot limits

- Total: ₹2,500/month hard ceiling.
- OpenAI: ₹750/month.
- Media worker: ₹250/month.
- X: disabled and ₹0.

Never upgrade Supabase or enable paid providers without checking the total projected cost.


## Evidence upload contract

Evidence is private by default and never stored in the public repository.

1. Obtain signed upload details with an authenticated request:

```http
POST /v1/captures/init-upload
Authorization: Bearer <Supabase access token>
Content-Type: application/json

{"item_id":"<item id>","role":"screenshot","mime_type":"image/jpeg","byte_size":123456}
```

2. Upload the bytes directly to the returned Supabase signed-upload path using the returned token. The signed upload URL expires after two hours.
3. Confirm the upload and record provenance:

```http
POST /v1/items/<item id>/assets
Authorization: Bearer <Supabase access token>
Content-Type: application/json

{"asset_id":"<asset id>","role":"screenshot","mime_type":"image/jpeg","byte_size":123456,"storage_path":"<returned path>","sha256":"<64-char lowercase sha256>"}
```

Allowed roles are `screenshot`, `original`, `pdf`, and `video`. Images and screenshots are permanent by default. Videos are temporary and receive a 30-day purge date unless retention is explicitly changed later. The server rejects paths outside the authenticated owner/item prefix.
