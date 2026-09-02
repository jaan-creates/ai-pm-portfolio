# Save & Recall — Build-Ready Product and Technical Plan

**Status:** Approved V1.1 build baseline
**Audience:** Owner/operator and implementation agent
**Date:** 1 September 2026
**Initial deployment:** Private, single-user, mobile-first
**Source hosting:** Public portfolio path `jaan-creates/ai-pm-portfolio/startup-track/projects/3-Save-Here`; production data, credentials, captures, media, and exports remain private

---

## 1. Executive decision

Build a private “save and recall” application with:

- An installable mobile web app for browsing, search, correction, and lifecycle management.
- Two iPhone Shortcuts as the first capture surface: **Save** and **Save Rich**.
- Supabase for authentication, PostgreSQL, private object storage, queues, scheduled work, and `pgvector` search.
- A small Next.js/TypeScript web application hosted on Vercel.
- OpenAI APIs for screenshot understanding, structured enrichment, speech transcription, and embeddings.
- An optional Cloud Run media worker for screen recordings and uploaded clips because ordinary serverless functions should not perform FFmpeg video processing.
- The official X API for X post lookup and, optionally, importing the owner’s X bookmarks.
- No Instagram password, session cookie, unofficial private API, or cookie-based Instagram MCP in the production system.

The system is intentionally not a complete mymind clone. It implements the essential loop:

> Capture → preserve → understand → find/resurface → act → complete/retain/delete.

### Primary Instagram decision

The Meta-supported Instagram APIs do **not** solve the primary use case of retrieving arbitrary Reels or posts viewed by a personal account. Meta’s official Instagram API is for professional accounts managing their own presence and media. An MCP server built on that API inherits the same limitation; MCP does not grant additional access.

Therefore, Instagram ingestion will use a graded capture strategy:

1. Save the shared Instagram URL immediately.
2. Attempt public metadata/oEmbed enrichment when the post is publicly embeddable.
3. If the result is login-gated or thin, retain a durable link-only card and visibly request optional evidence.
4. Accept a user-provided screenshot for OCR and visual understanding.
5. Accept a user-provided screen recording for speech transcription and sampled-frame understanding when the content is valuable enough to justify the extra capture effort.

This is honest graceful degradation. The application must never pretend that a link-only private Reel has been transcribed.

---

## 2. Answer: how Instagram login can and cannot be used

### 2.1 Safe use during development and manual testing

The owner can sign in to Instagram personally in an interactive browser opened for a testing session. The implementation agent may then:

- Open a shared URL in that already-authenticated browser.
- Inspect visible page behavior.
- Test how public, follower-only, and private content degrade.
- Take screenshots needed to diagnose the application’s capture experience.

The owner should type the password directly into Instagram. The password must never be pasted into chat, a repository, a `.env` file, a Shortcut, or a database.

Browser testing must not:

- Read or export browser cookies.
- Copy session tokens.
- Inspect password stores or browser profiles.
- Turn a temporary signed-in browser into the production ingestion mechanism.

The browser session is a manual testing aid only. It is not a durable application credential.

### 2.2 Official Meta OAuth

Official Meta login is useful only if the owner wants the app to manage or read media owned by the owner’s professional Instagram account. It does not authorize access to every post the owner can see in the Instagram app.

Meta’s verified Instagram API documentation states that the API is for Instagram professionals—businesses and creators—and can obtain/publish their media and manage their presence. It explicitly cannot access consumer accounts through the Facebook Login configuration. The newer Instagram Login configuration is also for professional accounts. See [Meta’s verified Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

For this personal recall product, Meta OAuth is **not required for V1**.

### 2.3 Instagram MCP assessment

There is no callable Instagram connector installed in the current environment. Community Instagram MCP servers fall into two categories:

1. **Official Graph API wrappers:** safer, but limited to the same professional-account data available through Meta’s API. They do not retrieve arbitrary private Reels viewed by the owner.
2. **Unofficial private API/scraping wrappers:** typically require a username/password, browser cookie, or mobile session. They introduce account-lock, credential, terms-of-service, and maintenance risk.

Do not install or build an Instagram MCP for V1. The product backend already has deterministic source adapters and does not benefit from putting an agent protocol between it and Meta.

### 2.4 Rejected production approach: authenticated scraping

Do not run a cloud browser logged into the owner’s personal Instagram account to scrape posts. Do not use services that request an Instagram password or `sessionid` cookie.

Reasons:

- Credentials or reusable sessions become high-value secrets.
- Meta actively detects and blocks unauthorized scraping.
- The behavior is brittle and changes without notice.
- It can trigger challenges, forced logouts, or account restriction.
- It turns a low-maintenance personal tool into an automation system that needs babysitting.
- It may copy content beyond what is necessary for personal recall.

Meta describes unauthorized automated collection as scraping in violation of its terms and documents active enforcement against it. See [Meta’s explanation of scraping enforcement](https://about.fb.com/news/2021/05/scraping-by-the-numbers/amp/).

---

## 3. Product definition

### 3.1 User

- One owner.
- Non-technical daily operator.
- iPhone is the primary capture device.
- Retrieval occurs on iPhone and desktop.
- Content may mix English with an Indian regional language and transliteration.

### 3.2 Core jobs

1. Save something from almost any iPhone app without choosing a destination.
2. Preserve enough evidence to recognize the item later.
3. Find it by approximate memory, purpose, source, date, object, or action.
4. Resurface useful or expiring saves.
5. Record whether it was read, watched, bought, cooked, used, retained, or discarded.

### 3.3 V1 content scope

Included:

- URLs.
- Instagram post and Reel URLs.
- X post URLs.
- Public web pages and articles.
- Screenshots and ordinary images.
- PDFs.
- Plain text and typed notes.
- User-provided short video clips and screen recordings.

Excluded from V1:

- Automated downloading of Instagram/TikTok media.
- Instagram private API access.
- Continuous scraping of Instagram saves, likes, DMs, or feed.
- Multi-user sharing and collaboration.
- App Store distribution.
- Android application.
- Browser extension.
- General-purpose note taking.
- Folder hierarchies or knowledge graphs.
- External content recommendation.

### 3.4 Definition of success

The product succeeds only when saved items are found and acted upon.

Track:

- Capture success rate.
- Median capture time.
- Processing success and partial-success rates.
- Recall result opened from the top five results.
- Time from query to result open.
- Percentage of eligible saves acted on within 30 and 90 days.
- Count of pending items older than 60 and 90 days.
- Weekly review participation.
- Correction rate and repeated enrichment failures.

Initial acceptance targets:

- ≥ 95% of capture attempts create a durable item.
- Ordinary link capture completes in ≤ 5 seconds at the user-interaction layer.
- Screenshot/PDF capture completes in ≤ 15 seconds at the user-interaction layer; background enrichment may continue.
- ≥ 80% of the fixed recall test set produces the intended item in the top five.
- No input is lost because AI processing failed.

---

## 4. User experience specification

### 4.1 Capture surfaces

### Shortcut A: Save

Purpose: fastest possible capture.

Accepted iOS share input types:

- URL/web page.
- Text.
- Image.
- PDF/file.
- Video.

Behavior:

1. Receive the shared object.
2. Generate a client capture UUID.
3. Determine coarse type locally.
4. For a small URL/text payload, call the capture endpoint directly.
5. For a file, request a signed upload URL, upload directly to private storage, and call capture completion.
6. Show `Saved` when durable storage is confirmed.
7. Do not ask for tags, folder, intent, or title.

Failure behavior:

- Retry one time for transient network errors.
- If still unsuccessful, keep a small local retry record in the Shortcut and display `Not saved — tap to retry`.
- Never display `Saved` before the server confirms the record and any required upload.

### Shortcut B: Save Rich

Purpose: optional context or evidence.

Behavior:

1. Accept the same input types.
2. Ask for an optional short note.
3. If the input is an image/video and the clipboard contains a valid Instagram or X URL, ask `Attach copied source link?` with the URL previewed.
4. Upload input plus the optional note and source URL.

Recommended Instagram rich-capture flow:

1. In Instagram, copy the Reel/post link.
2. For visual content, take a screenshot; for speech-heavy valuable content, make a short screen recording.
3. Share the screenshot/recording to **Save Rich**.
4. The Shortcut offers to attach the copied Instagram URL.

This is an exception path, not the default for every Reel.

### Web app quick capture

The installed web app must also provide:

- Paste URL.
- Add note.
- Upload file.
- Camera/photo-library chooser.

### 4.2 Main application screens

### Everything/Search

- Search bar fixed near the top.
- Card grid/list toggle.
- Default sort: most recently saved.
- Filters: source, date, content type, intent, status, language, capture quality.

### Pending

- Items with actionable intent and no completion event.
- Group optional: Watch, Read, Buy, Make/Cook, Learn, Visit, Other.
- Classification is editable and never controls whether universal search can find the item.

### Top of Mind

- Maximum three pinned items.
- User-controlled order.
- Empty state invites one deliberate priority, not bulk pinning.

### Review

- Five suggested cards at a time.
- Actions: Keep pending, Pin, Complete, Keep as reference, Remind later, Delete.
- Explanations: `Saved 73 days ago`, `expires soon`, `saved twice`, or `related to recent search`.

### Completed

- Read/watched/bought/made/visited/used events.
- Completed items remain searchable.
- User can change to Reference or Delete.

### Item detail

- Original source and stored evidence.
- User note visually distinguished from machine output.
- Summary, transcript/OCR, source metadata, and inferred intent.
- Processing/capture-quality badge.
- `Why this matched` when opened from search.
- Correction, reprocess, export, and delete actions.

### 4.3 Capture-quality states

Every item receives a visible quality state:

- `full_text`: readable page/PDF/transcript captured.
- `metadata`: title/creator/thumbnail/caption-like metadata captured.
- `visual`: screenshot or sampled frames understood.
- `audio_visual`: user-provided recording transcribed and sampled.
- `link_only`: only source URL and time are durable.
- `failed`: payload exists, but enrichment failed.

Never hide `link_only` or `failed` items. Offer `Add screenshot or recording` from item detail.

---

## 5. Source-specific capture matrix

| Source/input | Default capture | Enrichment | Durable evidence | Important limitation |
|---|---|---|---|---|
| Instagram public URL | URL via share sheet | Public metadata/oEmbed when allowed; ordinary HTML metadata fallback | URL, author/thumbnail when returned, saved time | No guaranteed caption, media file, or speech transcript |
| Instagram private/login-gated URL | URL via share sheet | Usually none beyond URL pattern | URL and saved time | Backend cannot use owner’s mobile-app login |
| Instagram screenshot | Image via Save Rich | OCR + vision summary | Original image, OCR, description | Cannot recover speech not shown onscreen |
| Instagram screen recording | Video via Save Rich | Audio transcription + sampled-frame vision | Original clip, transcript, frame summary | Extra user effort; only process recordings provided by owner |
| X URL | URL via share sheet | Official Post Lookup API | Post text, author, timestamp, media metadata | API credits and developer credentials required |
| X bookmarks import | OAuth connection | Official bookmark endpoint | Post content and source metadata | Optional; not required for one-off shares |
| Public article | URL | Fetch + Readability-style extraction | Extracted Markdown/text; optional raw HTML | Paywalls/login pages may return thin content |
| Screenshot/image | File | OCR + vision | Original file + derived text | Handwriting/language accuracy varies |
| PDF | File | Text extraction; page images for scanned PDFs | Original PDF + extracted text | Scanned PDFs require OCR/vision |
| Text note | Text | Language/intent enrichment | Original text | None |

### X decision

X integration is safe and useful because the official API supports direct post lookup with media expansions and OAuth-based bookmark reads. Current documentation describes `GET /2/tweets/:id` for public post lookup and `bookmark.read` with OAuth 2.0 PKCE for private bookmarks. See [X Post Lookup](https://docs.x.com/x-api/posts/lookup/introduction) and [X Bookmarks Lookup](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup).

X currently uses pay-per-use pricing; ordinary Post reads are listed at $0.005 per resource and owner bookmark reads can qualify for lower owned-read pricing. Set a strict developer-console spending limit. See [X API pricing](https://docs.x.com/x-api/getting-started/pricing).

---

## 6. System architecture

```text
┌──────────────────────────── Capture ────────────────────────────┐
│ iOS Save Shortcut  iOS Save Rich  PWA form  X OAuth/import     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────── Supabase / application core ───────────────┐
│ Capture Edge Function                                          │
│   ├─ validates capture token                                   │
│   ├─ creates item/capture records                              │
│   ├─ issues signed file-upload URLs                            │
│   └─ enqueues idempotent jobs                                  │
│                                                                │
│ Postgres + RLS       Private Storage       pgmq + pg_cron       │
│ Items/events/jobs    Original evidence     retries/schedules    │
│ FTS + pg_trgm        Previews/derivatives  weekly review        │
│ pgvector chunks                                               │
└───────────────┬────────────────────┬────────────────────────────┘
                │                    │
                │ text/image         │ uploaded video
                ▼                    ▼
┌────────────────────────┐  ┌─────────────────────────────────────┐
│ OpenAI APIs            │  │ Cloud Run media worker             │
│ structured enrichment  │  │ FFmpeg audio extraction            │
│ vision/OCR assistance  │  │ bounded frame sampling             │
│ transcription          │◄─┤ calls transcription/vision          │
│ embeddings             │  │ uploads derivatives, deletes temp  │
└────────────────────────┘  └─────────────────────────────────────┘
                │
                ▼
┌──────────────────────── Retrieval ──────────────────────────────┐
│ Next.js PWA: hybrid search, cards, review, corrections, export  │
│ Vercel deployment; Supabase auth and signed asset URLs          │
└──────────────────────────────────────────────────────────────────┘
```

### 6.1 Selected services

| Concern | Selection | Why |
|---|---|---|
| Web UI | Next.js + TypeScript | Strong PWA ecosystem, server/client support, maintainable conventions |
| Web hosting | Vercel | Low operational burden and straightforward Next.js deployment |
| Database/auth/storage | Supabase | One managed account for Postgres, Auth, Storage, RLS, functions and scheduled jobs |
| Search | Postgres FTS + `pg_trgm` + `pgvector` | Avoid a separate search/vector vendor for a collection of thousands |
| Background work | `pgmq`, Edge Functions, `pg_cron` | Durable retries inside the primary platform |
| AI enrichment | OpenAI Responses API | Text/image/file input and structured JSON output |
| Embeddings | `text-embedding-3-small` initially | Low cost and adequate personal-scale semantic search |
| Audio transcription | `gpt-4o-mini-transcribe` initially | Dedicated multilingual speech-to-text endpoint |
| Video preprocessing | Google Cloud Run service/job with FFmpeg | Supports normal containers/binaries and scales down when unused |
| Email | Resend, optional | Weekly review and time-sensitive notifications without push infrastructure |
| Error tracking | Supabase logs initially; Sentry later only if needed | Minimize services before usage proves the need |

OpenAI’s current small multimodal model supports image input and structured outputs, but not direct video input. Video must therefore be converted to audio and frames before model calls. See [GPT-5.4 Mini model capabilities](https://developers.openai.com/api/docs/models/gpt-5.4-mini) and [GPT-4o Mini Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe).

### 6.2 Deployment environments

Use separate Supabase projects and Vercel environments:

- `local`: local app and local Supabase where feasible.
- `staging`: synthetic/test content only.
- `production`: real personal library.

Do not copy production saved content into staging.

---

## 7. Repository structure

Create the repository as a pnpm workspace:

```text
/
├─ apps/
│  └─ web/                         # Next.js PWA
├─ packages/
│  ├─ domain/                      # Types, schemas, enums, scoring contracts
│  ├─ ui/                          # Shared visual components
│  ├─ source-adapters/             # Instagram, X, webpage adapters
│  └─ ai/                          # Prompts, JSON schemas, model wrappers
├─ supabase/
│  ├─ migrations/                  # Versioned SQL only
│  ├─ functions/
│  │  ├─ capture-init/
│  │  ├─ capture-complete/
│  │  ├─ process-jobs/
│  │  ├─ search/
│  │  ├─ weekly-review/
│  │  └─ export-library/
│  └─ seed.sql                     # Synthetic data only
├─ workers/
│  └─ media/                       # Cloud Run container + FFmpeg
├─ shortcuts/
│  ├─ SAVE_SETUP.md
│  └─ SAVE_RICH_SETUP.md
├─ evals/
│  ├─ fixtures/                    # Synthetic and owner-approved samples
│  ├─ recall-queries.jsonl
│  └─ expected-results.jsonl
├─ docs/
│  ├─ architecture.md
│  ├─ privacy.md
│  ├─ operations.md
│  └─ decisions/
├─ .env.example                    # Names only, never secrets
├─ BUILD_PLAN.md
└─ README.md
```

Implementation rules:

- All database changes are migrations.
- AI prompts and structured-output schemas are versioned in the repository.
- Source adapters return a shared normalized result.
- All external calls have timeouts, bounded retries, and recorded provenance.
- No secret is committed or printed in logs.

---

## 8. Domain model and database schema

### 8.1 Enums

```text
item_status:
  pending | completed | reference | deleted

input_type:
  url | text | image | pdf | video | file

content_type:
  article | instagram_post | instagram_reel | x_post | video |
  product | recipe | image | pdf | note | event | other

intent:
  read | watch | buy | make | cook | learn | reference | visit | try | unknown

capture_quality:
  full_text | metadata | visual | audio_visual | link_only | failed

processing_status:
  received | stored | queued | extracting | enriching | indexing |
  ready | partial | failed

event_type:
  captured | opened | searched_result | pinned | unpinned | completed |
  referenced | resurfaced | snoozed | corrected | reprocessed | exported |
  review_generated | soft_deleted | restored | permanently_deleted
```

### 8.2 `items`

Canonical user-facing record.

```text
id uuid primary key
owner_id uuid not null
status item_status not null default 'pending'
input_type input_type not null
content_type content_type not null default 'other'
intent intent not null default 'unknown'
capture_quality capture_quality not null default 'link_only'
processing_status processing_status not null default 'received'

original_url text null
canonical_url text null
source_domain text null
source_native_id text null
source_author text null
source_published_at timestamptz null

title text null
user_note text null
summary_original text null
summary_english text null
extracted_text text null
transcript text null
ocr_text text null
search_document text null

languages text[] not null default '{}'
topics text[] not null default '{}'
entities jsonb not null default '[]'
ai_metadata jsonb not null default '{}'
classification_confidence real null

saved_at timestamptz not null default now()
last_captured_at timestamptz not null default now()
last_opened_at timestamptz null
completed_at timestamptz null
resurface_at timestamptz null
expiry_at timestamptz null
pinned_position smallint null

content_hash text null
canonical_url_hash text null
duplicate_of uuid null references items(id)

enrichment_version text null
deleted_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Indexes:

- `(owner_id, saved_at desc)`.
- `(owner_id, status, saved_at desc)`.
- Unique partial `(owner_id, canonical_url_hash)` for active canonical URL items, after duplicate policy is proven.
- GIN on arrays only where real queries require it.
- Generated `tsvector` using the `simple` configuration for multilingual token preservation.
- `pg_trgm` indexes on title, source author, and user note.

### 8.3 `captures`

Every save attempt, including repeated saves of one canonical item.

```text
id uuid primary key                 # client-generated idempotency key
owner_id uuid not null
item_id uuid null references items(id)
device_id uuid not null
shortcut_version text null
shared_type text not null
raw_text text null
shared_url text null
clipboard_source_url text null
user_note text null
received_at timestamptz not null
stored_at timestamptz null
result text not null                # created | merged | failed
error_code text null
```

Repeated capture must create a `captures` row even when it merges into an existing item. Repeated saves are a relevance signal.

### 8.4 `assets`

```text
id uuid primary key
owner_id uuid not null
item_id uuid not null references items(id)
capture_id uuid null references captures(id)
role text not null                  # original | screenshot | pdf | video | preview | frame | audio_temp
storage_bucket text not null
storage_path text not null
mime_type text not null
byte_size bigint not null
sha256 text not null
width integer null
height integer null
duration_ms bigint null
derived_from uuid null references assets(id)
retention_class text not null       # permanent | derivative | temporary
purge_after timestamptz null         # originals purge after this time unless retained
created_at timestamptz not null
deleted_at timestamptz null
```

Private bucket only. Temporary extracted audio is deleted after transcription succeeds or after a short failure-retention window.

### 8.5 `item_chunks`

Long content is chunked for retrieval.

```text
id uuid primary key
owner_id uuid not null
item_id uuid not null references items(id)
chunk_index integer not null
chunk_type text not null             # note | summary | body | transcript | ocr
content text not null
token_count integer not null
embedding vector(<model-dimension>) null
embedding_model text null
created_at timestamptz not null
```

Unique `(item_id, chunk_type, chunk_index)`.

Do not hard-code a vector dimension until the embedding model is selected and verified in implementation. Record the model name with every vector so migrations are possible.

### 8.6 `item_events`

Append-only outcome and behavior log.

```text
id bigint generated always as identity
owner_id uuid not null
item_id uuid not null references items(id)
event_type event_type not null
occurred_at timestamptz not null default now()
metadata jsonb not null default '{}'
```

### 8.7 `jobs`

Use `pgmq` for queue mechanics and a durable job ledger for operator visibility.

```text
id uuid primary key
owner_id uuid not null
item_id uuid not null
job_type text not null
status text not null                 # queued | running | retry | succeeded | failed | dead_letter
attempt_count integer not null default 0
max_attempts integer not null
not_before timestamptz not null
locked_at timestamptz null
finished_at timestamptz null
last_error_code text null
last_error_redacted text null
provider_request_id text null
cost_estimate_usd numeric null
created_at timestamptz not null
updated_at timestamptz not null
```

### 8.8 `enrichment_runs`

```text
id uuid primary key
owner_id uuid not null
item_id uuid not null
stage text not null
provider text not null
model text null
prompt_version text null
input_fingerprint text not null
status text not null
usage jsonb null
estimated_cost_usd numeric null
started_at timestamptz not null
finished_at timestamptz null
error_code text null
```

Do not store full sensitive prompts/responses in logs. The canonical results belong on the item; provenance belongs here.

### 8.9 `search_events`

```text
id bigint generated always as identity
owner_id uuid not null
query_text text not null
query_language text null
result_item_ids uuid[] not null
opened_item_id uuid null
latency_ms integer not null
created_at timestamptz not null
```

### 8.10 `device_tokens`

Capture-only credentials for Shortcuts.

```text
id uuid primary key
owner_id uuid not null
device_name text not null
token_hash text not null
scopes text[] not null default '{capture}'
last_used_at timestamptz null
expires_at timestamptz null
revoked_at timestamptz null
created_at timestamptz not null
```

Generate at least 256 random bits for the bearer token and store only an HMAC-SHA-256 digest using a server-side pepper. The plaintext token lives in the owner’s Shortcut configuration and can be revoked.

---

## 9. API contract

All endpoints are versioned under `/v1`. UI calls use the authenticated Supabase session. Shortcuts use a capture-only bearer token.

### 9.1 Capture

#### `POST /v1/captures`

For URL, text, and small metadata-only capture.

Request:

```json
{
  "capture_id": "uuid",
  "input_type": "url",
  "shared_url": "https://www.instagram.com/reel/…/",
  "shared_text": null,
  "user_note": null,
  "device": {
    "id": "uuid",
    "shortcut_version": "1.0.0"
  }
}
```

Response:

```json
{
  "capture_id": "uuid",
  "item_id": "uuid",
  "result": "created",
  "processing_status": "queued"
}
```

Requirements:

- Idempotent by `capture_id`.
- Normalize and validate URLs server-side.
- Do not fetch the source synchronously.
- Target response time under 1.5 seconds excluding mobile network latency.

#### `POST /v1/captures/init-upload`

Returns a signed upload URL and capture record for a file.

Request fields:

- Capture ID.
- MIME type.
- Byte size.
- SHA-256 when available.
- Optional source URL and note.

Enforce type/size limits before issuing the URL.

#### `POST /v1/captures/{capture_id}/complete`

Confirms successful storage upload, creates/merges the item, and queues work.

### 9.2 Items

- `GET /v1/items` — cursor pagination and filters.
- `GET /v1/items/{id}` — full item and signed asset URLs.
- `PATCH /v1/items/{id}` — user note, title, intent, status, resurface/expiry, pin.
- `DELETE /v1/items/{id}` — soft delete.
- `POST /v1/items/{id}/restore`.
- `POST /v1/items/{id}/reprocess` — stage-selective and rate-limited.
- `POST /v1/items/{id}/assets` — add screenshot/recording evidence.
- `GET /v1/review/current` — current in-app review candidates and generation event.
- `POST /v1/review/{item_id}/snooze` — defer one review candidate.
- `PATCH /v1/assets/{asset_id}/retention` — keep an original or restore its default purge policy.

All corrections generate `item_events` records. Editing a user note or retrieval-relevant field queues search-document regeneration and re-embedding.

### 9.3 Search

#### `POST /v1/search`

```json
{
  "query": "that Malayalam reel about shoulder pain from last month",
  "filters": {
    "status": ["pending", "reference"],
    "source": ["instagram.com"]
  },
  "limit": 20
}
```

Response result fields:

- Item card data.
- Combined score.
- Match reasons.
- Best matching excerpt.
- Search quality/capture-quality badge.

### 9.4 Review and lifecycle

- `GET /v1/review?limit=5`.
- `POST /v1/items/{id}/complete` with action type.
- `POST /v1/items/{id}/reference`.
- `POST /v1/items/{id}/pin`.
- `POST /v1/items/{id}/snooze`.

### 9.5 Operations and ownership

- `GET /v1/health/processing` — counts and oldest stuck job.
- `GET /v1/costs` — provider usage estimates.
- `POST /v1/export` — asynchronous export request.
- `GET /v1/export/{id}` — status and signed download URL.

---

## 10. Processing state machine

```text
received
   │
   ▼
stored ──► queued ──► extracting ──► enriching ──► indexing ──► ready
                         │                │              │
                         └──────── partial/failed ◄──────┘
```

### 10.1 Job stages

1. `normalize_input`
2. `detect_duplicate`
3. `fetch_source_metadata`
4. `extract_document_text`
5. `process_image`
6. `process_video`
7. `transcribe_audio`
8. `structured_enrichment`
9. `build_search_document`
10. `chunk_content`
11. `generate_embeddings`
12. `finalize_item`

### 10.2 Retry policy

Classify errors:

- `permanent_input`: invalid URL/file, unsupported format; do not retry.
- `source_denied`: private/login/robots/403; mark partial, not failed.
- `provider_rate_limit`: exponential retry with jitter.
- `provider_timeout`: bounded retry.
- `schema_failure`: one repair retry, then mark partial and retain raw extraction.
- `internal_bug`: retry once, then dead-letter and alert.

Default retry delays: approximately 1 minute, 5 minutes, 30 minutes, 3 hours, with provider-specific `Retry-After` taking precedence.

No job may run indefinitely. Every external request must have a timeout.

### 10.3 Idempotency

- Capture: client UUID.
- Source fetch: `(item_id, canonical_url, adapter_version)` fingerprint.
- AI enrichment: `(content_fingerprint, prompt_version, model_snapshot)`.
- Embedding: `(chunk_hash, embedding_model)`.
- Video processing: `(asset_sha256, worker_version)`.

Retries must reuse fingerprints and avoid double billing where possible.

---

## 11. Source adapters

Every adapter implements:

```ts
interface SourceAdapter {
  canHandle(input: NormalizedInput): boolean;
  normalizeUrl(url: URL): NormalizedSourceUrl;
  fetchMetadata(ctx: AdapterContext): Promise<AdapterResult>;
}

interface AdapterResult {
  canonicalUrl?: string;
  nativeId?: string;
  title?: string;
  author?: string;
  publishedAt?: string;
  description?: string;
  thumbnailUrl?: string;
  extractedText?: string;
  captureQuality: "full_text" | "metadata" | "link_only";
  provenance: Array<{ field: string; method: string }>;
  limitations: string[];
}
```

### 11.1 Instagram adapter

URL patterns:

- `/p/{shortcode}`
- `/reel/{shortcode}`
- `/tv/{shortcode}` where still encountered
- short links after bounded redirect resolution

Pipeline:

1. Normalize host, strip tracking parameters, retain shortcode.
2. Attempt the currently supported public oEmbed/metadata route only for public, embeddable content.
3. If unavailable, perform a normal anonymous HTTP fetch with a conservative timeout and extract only public metadata returned to an ordinary client.
4. Never attach an Instagram cookie or owner access token to arbitrary-post fetches.
5. Never treat embed HTML as permission to download media.
6. Mark a result `metadata` or `link_only` accurately.
7. If `link_only`, schedule no repeated automated scraping. Prompt for optional screenshot/recording evidence.

Stored provenance examples:

- `title: oembed`
- `author: oembed`
- `thumbnail: open_graph`
- `ocr_text: user_screenshot`
- `transcript: user_screen_recording`

### 11.2 X adapter

1. Parse post ID from `x.com` or legacy `twitter.com` URLs.
2. Query official Post Lookup with fields and expansions for:
   - Text.
   - Author ID/name/handle.
   - Created time.
   - Language.
   - Entities/URLs.
   - Attached media type, preview, alt text, dimensions, and duration when returned.
3. Cache immutable response fields and avoid repeated billable reads.
4. If the API is unavailable or the budget cap is reached, fall back to public page metadata and preserve the URL.

Optional later feature: OAuth 2.0 PKCE connection with `bookmark.read`, `tweet.read`, and `users.read`, importing only new bookmarks since the last cursor.

### 11.3 Generic webpage adapter

1. Resolve at most five redirects.
2. Block private/internal IP ranges and non-HTTP schemes to prevent SSRF.
3. Enforce response-size and content-type limits.
4. Save canonical metadata.
5. Extract readable text with a maintained Readability-style library.
6. Store extracted Markdown/text; storing raw HTML is configurable and off by default for sensitive domains.
7. Never try to defeat a paywall or login wall.

### 11.4 PDF adapter

- Text PDF: extract text and metadata locally/server-side.
- Scanned PDF: rasterize a bounded number of pages for OCR/vision, then continue in batches.
- Preserve original file permanently unless user deletes it.
- Record incomplete extraction when page limits are reached.

---

## 12. Screenshot, image, and video processing

### 12.1 Image pipeline

1. Validate and virus-scan where supported.
2. Normalize orientation.
3. Generate a display preview without overwriting the original.
4. Run deterministic OCR first when available.
5. Send the image plus OCR text and optional note to the vision model.
6. Require structured output.
7. Store OCR separately from AI description.

The model must be instructed:

- Do not claim invisible speech or offscreen context.
- Preserve original-language text.
- Distinguish observation from inference.
- Extract handles, product names, prices, dates, ingredients, and on-screen calls to action when visible.
- Return low confidence when the screenshot is ambiguous.

### 12.2 Video/screen-recording pipeline

Trigger only for an uploaded user-owned or user-recorded asset.

Cloud Run worker steps:

1. Obtain a short-lived signed download URL.
2. Download to ephemeral disk.
3. Run `ffprobe` for duration, codecs, and streams.
4. Enforce duration and byte-size limits.
5. Extract mono 16 kHz audio with FFmpeg.
6. Transcribe with the dedicated transcription endpoint.
7. Sample frames adaptively:
   - First frame.
   - Scene-change candidates where feasible.
   - Otherwise every 5 seconds.
   - Maximum 12 frames in V1.
8. Create a contact sheet or bounded multi-image vision request.
9. Merge transcript, visible text, visual sequence, user note, and source URL in structured enrichment.
10. Upload preview/contact sheet.
11. Delete ephemeral files and temporary audio.
12. Mark `audio_visual` or a truthful partial state.

Initial limits:

- Maximum uploaded video: 200 MB.
- Maximum processed duration: 10 minutes.
- Maximum 12 frames for visual enrichment.
- Longer recordings remain stored but require manual trimming before transcription.

Cloud Run is appropriate because it accepts ordinary containers and binaries and scales down when idle. Google documents scale-to-zero behavior and FFmpeg-based video jobs. See [Cloud Run](https://cloud.google.com/run) and [FFmpeg video processing on Cloud Run](https://docs.cloud.google.com/run/docs/tutorials/video-encoding).

---

## 13. AI enrichment specification

### 13.1 Principles

- Preserve before enriching.
- User note outranks machine inference.
- Structured output only for canonical fields.
- Pin a model snapshot after evaluation; do not silently change models.
- Store model and prompt versions.
- Keep original-language content.
- Do not manufacture captions or transcripts.
- One inexpensive first pass; stronger reprocessing only when requested or low confidence matters.

### 13.2 Canonical structured schema

```json
{
  "display_title": "string",
  "content_type": "article|instagram_post|instagram_reel|x_post|video|product|recipe|image|pdf|note|event|other",
  "intent": "read|watch|buy|make|cook|learn|reference|visit|try|unknown",
  "summary_original": "string|null",
  "summary_english": "string|null",
  "languages": ["BCP-47 code"],
  "topics": ["string"],
  "entities": [
    {
      "type": "person|creator|brand|product|place|ingredient|date|price|other",
      "value": "string",
      "normalized": "string|null"
    }
  ],
  "search_phrases": ["string"],
  "time_sensitivity": {
    "is_time_sensitive": false,
    "suggested_expiry_at": null,
    "reason": null
  },
  "observations": ["directly supported fact"],
  "inferences": ["clearly labeled inference"],
  "limitations": ["missing audio", "private source", "partial screenshot"],
  "confidence": 0.0
}
```

### 13.3 Model use

- Text and screenshots: start with a pinned GPT-5.4 Mini snapshot after evaluation.
- Embeddings: start with `text-embedding-3-small` and record dimensions/model.
- Audio: start with the current `gpt-4o-mini-transcribe` snapshot after multilingual testing.
- Set `store: false` for stateless Responses API calls.
- Never use OpenAI-hosted vector stores for the personal library; keep vectors in owned Postgres.

OpenAI states that API content is not used for training unless the customer opts in. Default abuse-monitoring logs may retain content for up to 30 days; stricter retention controls require eligibility/approval. See [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint).

### 13.4 Multilingual strategy

At index time:

- Retain original text and script.
- Generate a short English gloss for recall across languages.
- Preserve common transliterations found in the content.
- Do not translate proper nouns unnecessarily.

At query time:

1. Search the raw query with keyword and vector methods.
2. If result confidence is low and the query is non-English or transliterated, create one bounded query expansion containing the original plus English gloss.
3. Rerun retrieval, not full answer generation.

Evaluate using the owner’s actual language pair before relying on cross-language recall.

---

## 14. Search and ranking

### 14.1 Indexing

Create one `search_document` per item from, in priority order:

1. User note.
2. User-corrected title.
3. Source title/author/creator.
4. Transcript or body text.
5. OCR.
6. Original and English summaries.
7. Intent/topics/entities.
8. Source domain and saved date tokens.

Long body/transcript content is split into approximately 700–1,000-token chunks with limited overlap. User note and summary receive their own chunks.

### 14.2 Retrieval channels

- PostgreSQL full-text search using `simple` configuration.
- Trigram similarity for remembered fragments and spelling variation.
- Vector search over chunks.
- Structured filters for source, date, type, status, intent, language, and capture quality.

### 14.3 Fusion

Use Reciprocal Rank Fusion or another deterministic fusion strategy rather than adding incomparable raw scores.

Suggested initial channel priorities:

- User-note exact/FTS match: highest.
- Title/source author match: high.
- Semantic chunk match: high.
- OCR/transcript match: normal.
- Inferred topic/entity match: normal.
- Recency: small tie-breaker only.
- Repeated capture count: small positive signal.

Do not let recency bury an older strong semantic match.

### 14.4 Result explanation

Return up to three concise reasons:

- `Your note contains “dinner party”.`
- `Transcript discusses shoulder mobility.`
- `Saved from Instagram in August 2026.`

Never expose raw embeddings or internal model reasoning.

---

## 15. Duplicates

### Exact URL duplicate

- Normalize URL and shortcode/post ID.
- Merge into the existing active item.
- Create a new capture event.
- Update `last_captured_at`/relevance signal.
- Append a new user note only with explicit confirmation; do not overwrite the first note.

### Exact asset duplicate

- Match SHA-256.
- Reuse the asset/item where appropriate and record another capture.

### Near duplicate

Deferred until exact handling works. Later signals may include:

- Same Instagram/X native ID after different URL forms.
- Perceptual image hash.
- Very high title/body similarity.
- Highly similar embeddings within a short window.

Never auto-delete a near duplicate. Suggest a merge.

---

## 16. Lifecycle and resurfacing

### 16.1 State rules

- New actionable item: `pending`.
- Item without actionable intent: `reference` may be suggested but not forced.
- Completion records action and time.
- Completed reusable knowledge can be moved to `reference`.
- Delete is recoverable for 30 days.

### 16.2 Review candidate score

Candidate factors:

- Approaching explicit or approved expiry.
- Pinned but untouched.
- Repeatedly saved.
- Pending 30/60/90 days.
- Related to recent searches or opened items.
- Random diversity component to avoid a narrow loop.

Exclude:

- Deleted items.
- Recently dismissed/snoozed items.
- Items already reviewed too frequently.

### 16.3 Notifications

V1:

- Weekly email with five candidates.
- Time-sensitive email only after the owner approves the suggested date.
- A local iPhone Reminder to open the Review screen can replace email during early testing.

Do not implement iOS push notifications before there is evidence they materially improve action rate.

---

## 17. Privacy and security

### 17.1 Data processors

Real content may pass through:

- Supabase: database and files.
- OpenAI: selected text/images/audio for enrichment.
- Vercel: application requests; configure logs to avoid content bodies.
- Google Cloud Run: uploaded screen recordings during preprocessing.
- Resend: item titles/links included in digest email, if enabled.
- X: official API requests for X content.

Instagram credentials are not a processor input because the application will not collect them.

### 17.2 Required controls

- Supabase RLS on every owner-data table.
- Private object-storage buckets only.
- Short-lived signed URLs.
- Capture token limited to capture endpoints.
- Device-token revocation UI.
- Service-role keys only in server secrets.
- OpenAI and X keys only server-side.
- Cloud Run endpoint protected by IAM or signed requests.
- SSRF protection on URL fetcher.
- File MIME sniffing, size limits, and safe filenames.
- Content bodies excluded from routine logs.
- `store: false` for OpenAI Responses calls.
- Soft delete followed by scheduled permanent deletion.
- Complete export before account/project teardown.

### 17.3 Secret inventory

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CAPTURE_TOKEN_PEPPER
OPENAI_API_KEY
X_CLIENT_ID
X_CLIENT_SECRET                 # only if required by selected OAuth flow
X_BEARER_TOKEN                  # public lookup, if used
RESEND_API_KEY                  # optional
MEDIA_WORKER_SIGNING_SECRET
APP_BASE_URL
```

The repository `.env.example` contains variable names and explanations only.

### 17.4 Content exclusions

Until a local-only mode exists, do not save:

- Passwords or recovery codes.
- Aadhaar/passport/identity documents.
- Sensitive financial or medical records.
- Confidential work/client information.
- Intimate/private content involving other people without a legitimate need.

---

## 18. Ownership, backup, and deletion

### 18.1 Export format

`Export everything` produces one ZIP:

```text
export-YYYY-MM-DD/
├─ manifest.json
├─ items.jsonl
├─ items.csv
├─ events.jsonl
├─ markdown/
│  └─ <item-id>.md
└─ assets/
   └─ <item-id>/<original files and previews>
```

Embeddings need not be portable; they can be regenerated. Enrichment results, provenance, user notes, and source metadata must be portable.

### 18.2 Backup policy

Development:

- Manual database dump before schema changes.

Production:

- Supabase Pro automatic database backups.
- Monthly automated portable export.
- Second-copy storage in an owner-controlled object-store account after V1 stabilizes.
- Quarterly restore test using a temporary project and synthetic/selected data.

### 18.3 Deletion

- Item delete: soft delete, hidden from search.
- Restore window: 30 days.
- Permanent deletion removes database text, chunks, vectors, assets, and derivatives.
- Temporary media-worker files are deleted immediately after successful processing and by a scheduled cleanup job after failures.

---

## 19. Reliability and maintenance

### 19.1 Operator health screen

Display:

- Items awaiting processing.
- Oldest queued/running job.
- Failed/dead-letter jobs.
- Last successful weekly review job.
- Storage usage.
- Estimated AI/X cost this month.
- Last successful export.

Provide `Retry` for safe stages and `Ignore/keep partial` for source-denied items.

### 19.2 Alerts

Send one concise owner email when:

- Dead-letter jobs exceed a threshold.
- No background job has succeeded for 24 hours while work is queued.
- Monthly cost reaches 50%, 80%, or 100% of the configured budget.
- Scheduled export fails twice.

Do not alert for expected Instagram `source_denied` outcomes.

### 19.3 Dependency policy

- Pin runtime versions.
- Use automated dependency update PRs at most weekly.
- Merge only after tests pass.
- Pin Meta Graph API version in any future official integration.
- Pin OpenAI model snapshots after evaluation.
- Review deprecation notices quarterly, not continuously.

---

## 20. Test and evaluation plan

### 20.1 Unit tests

- URL normalization for Instagram and X forms.
- Redirect and tracking-parameter stripping.
- SSRF protection.
- Duplicate decisions.
- Search-document construction.
- Lifecycle transitions.
- Expiry confirmation behavior.
- RRF/fusion determinism.
- Structured-output validation.

### 20.2 Integration tests

- Shortcut capture token and idempotency.
- Signed upload and completion.
- Queue retry/dead-letter behavior.
- RLS: a different user/session cannot read any item or asset.
- URL fetch timeouts and private-IP blocking.
- OpenAI mocked success/rate limit/schema error.
- X mocked success/budget exhaustion/deleted post.
- Media worker signed invocation and cleanup.
- Export completeness and restore.

### 20.3 Source acceptance corpus

Before launch, collect owner-approved samples:

- 10 public Instagram Reels/posts.
- 10 login/follower/private Instagram URLs expected to degrade.
- 10 Instagram screenshots.
- 5 short Instagram screen recordings with speech.
- 5 X posts including image/video/thread cases.
- 10 articles/products.
- 5 PDFs including at least one scanned PDF.
- 10 additional English items spanning short, ambiguous, visual, and intent-led content.

Do not commit private media to the repository. Store only synthetic fixtures or encrypted owner-approved test assets outside Git.

### 20.4 Recall evaluation

Create at least 30 natural queries before tuning search. Each entry contains:

```json
{
  "query": "that reel about shoulder pain from last month",
  "expected_item_id": "fixture-id",
  "acceptable_rank": 5,
  "language": "en",
  "memory_axis": ["topic", "source", "intent"]
}
```

Include queries by:

- Topic.
- Purpose/intent.
- Object/product.
- Creator/source.
- Approximate time.
- Visual memory.
- Creator aliases and incomplete remembered wording.
- Visual descriptions that do not appear in the title.
- Intent-led phrases such as "the one I wanted to buy".

Do not tune only on titles. Measure end-to-end result rank.

### 20.5 Usability test

For two weeks, capture at least 50 real items. Record only:

- Whether save succeeded.
- Approximate friction category: effortless, acceptable, annoying.
- Whether evidence was sufficient later.
- Whether the desired item was found.

Do not add new features during the first week unless capture loses data.

---

## 21. Build phases and gates

### Phase 0 — Foundation and evaluation set

Deliverables:

- Monorepo scaffold.
- CI with typecheck, lint, unit tests.
- Supabase local/staging setup and migration workflow.
- Synthetic seed content.
- Initial recall-query corpus.
- Architecture/security decision records.

Gate:

- Clean build on a new machine using README only.
- No real secrets or personal content in Git.

### Phase 1 — Durable capture, no AI dependency

Deliverables:

- Authenticated PWA shell.
- Items/captures/assets/events schema and RLS.
- Capture and upload endpoints.
- Save and Save Rich Shortcut instructions.
- Everything list and item detail.
- Exact duplicate handling.
- Processing state visible even before enrichment exists.

Gate:

- 30 mixed captures with no silent loss.
- Duplicate re-share creates another capture event, not an accidental duplicate.
- Capture still succeeds when all AI/provider integrations are disabled.

### Phase 2 — Deterministic source extraction

Deliverables:

- Instagram adapter with truthful metadata/link-only states.
- X official lookup adapter.
- Generic webpage extraction.
- PDF text extraction.
- Source provenance and limitations UI.

Gate:

- Private Instagram URLs become usable link-only cards without repeated scraping.
- No adapter sends authenticated Instagram cookies.
- X cost limit and caching verified.

### Phase 3 — Image and AI enrichment

Deliverables:

- Screenshot/image OCR and vision.
- Structured enrichment schema and versioned prompt.
- Multilingual original + English gloss.
- Confidence/limitation handling.
- Correction and reprocess UI.

Gate:

- Structured schema validation ≥ 99% after one bounded repair attempt.
- Screenshot test set produces useful search text without hallucinated audio/captions.

### Phase 4 — Hybrid retrieval

Deliverables:

- Search chunks and embeddings.
- FTS, trigram, vector retrieval and fusion.
- Search explanations and filters.
- Search-event instrumentation.

Gate:

- ≥ 80% recall test top-five success.
- P95 search latency target under 1.5 seconds at personal-library scale, excluding rare query expansion.

### Phase 5 — Lifecycle and resurfacing

Deliverables:

- Pending/completed/reference/delete states.
- Top of Mind.
- Review candidate generation.
- In-app weekly review workflow.
- Time-sensitive suggestion and explicit approval.
- Outcome dashboard.

Gate:

- Weekly review can be completed in ten minutes.
- No inferred date creates a notification without approval.
- If fewer than three of six consecutive reviews are opened, create a P2 iPhone Reminder enhancement.

### Phase 6 — Screen-recording transcription

Deliverables:

- Cloud Run media worker.
- FFmpeg audio extraction and bounded frame sampling.
- Transcription and multimodal merge.
- Temporary-file cleanup and cost controls.
- Thirty-day original-recording purge with an explicit `Keep original` override.

Gate:

- Five representative recordings process end to end.
- Audio/frame processing failure leaves the original recording and partial item intact until its purge date.
- No temporary audio remains after retention window.
- Originals without `Keep original` are deleted after 30 days while transcript and selected frames remain.

This phase may move earlier if speech-only Instagram Reels dominate the first 50 saved items.

### Phase 7 — Ownership and production hardening

Deliverables:

- Portable export.
- Restore test.
- Production Supabase project.
- Cost and failure alerts.
- Operations runbook.
- Soft-delete cleanup.

Gate:

- Successful restore into a clean temporary environment.
- Revoked Shortcut token can no longer capture.
- Production backup/export timestamp visible in health screen.

### Phase 8 — Native iOS decision

Evaluate a SwiftUI app and Share Extension only if:

- Shortcut share-sheet visibility/reliability is poor.
- Large uploads fail often.
- Save Rich requires too many steps.
- Native notifications materially improve use.

The native app must reuse the existing APIs and data model; it must not create a second backend.

---

## 22. Cost controls

Expected cost categories:

- Supabase: free for development and the controlled pilot; production Pro is a separate budget gate and must not be enabled silently.
- Vercel Hobby: free for this private, non-commercial personal pilot.
- OpenAI: usage-based; screenshot/video volume drives most variability.
- X: disabled with a ₹0 allocation until observed usage justifies official paid access.
- Cloud Run: usage-based and scale-to-zero; only enabled for screen-recording processing.
- Resend: likely entry/free allowance for one recipient.
- Domain and secondary backup storage: small recurring/annual costs.

Controls:

- Total pilot hard ceiling ₹2,500/month; target below ₹1,000.
- OpenAI sub-limit ₹750/month and media-worker sub-limit ₹250/month.
- Provider spending limits where offered.
- Application monthly soft/hard budgets.
- Maximum page characters sent to AI.
- Maximum frames and video duration.
- Cache X results and enrichment fingerprints.
- Do not re-enrich unchanged content.
- Show monthly estimated cost by stage.

OpenAI GPT-5.4 Mini is currently documented at $0.75 per million input text tokens and $4.50 per million output text tokens; image input is additionally tokenized according to image rules. `text-embedding-3-small` is documented at $0.02 per million tokens. Verify pricing again immediately before production deployment.

---

## 23. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Instagram private Reel provides only URL | Low retrieval value | Visible link-only state; add screenshot/recording evidence |
| Owner expects MCP/login to unlock arbitrary content | Architecture drift and account risk | Explicitly document API boundary; reject cookie/private API access |
| Screenshot lacks speech context | Incorrect/incomplete recall | State limitation; optional screen-recording path |
| Model misclassifies intent | Trust erosion | Universal search independent of classification; one-tap correction |
| Regional-language recall is weak | Failed retrieval | Original text + English gloss + transliteration tests and fallback query expansion |
| Provider/API changes | Enrichment failure | Adapters, versions, health screen, partial states, original preservation |
| Costs grow with video | Budget surprise | Disabled by default until configured; duration/frame limits; spend caps |
| Free hosting pauses or lacks backups | Unavailable library/data risk | Move production to paid backed-up tier before real dependence |
| Shortcuts are unreliable in some apps | Capture friction | Test early; native Share Extension only after evidence |
| Database backup excludes portable media ownership | Incomplete restore | Full application export plus second object copy |
| AI failure blocks capture | Data loss | Durable storage before queueing AI; independent processing states |

---

## 24. Decisions fixed for build start

Unless the owner changes them before implementation:

1. **Scope includes non-link content.**
2. **Instagram is URL-first with evidence fallback.**
3. **No Instagram password/cookie/private API.**
4. **No Instagram MCP in V1.**
5. **X official API is permitted and optional OAuth bookmark import comes later.**
6. **PWA + Shortcuts precedes native iOS.**
7. **Supabase is the application core.**
8. **Search is hybrid Postgres search, not a chat interface.**
9. **AI is asynchronous and never required for successful capture.**
10. **User note outranks inferred metadata.**
11. **Proactive resurfacing is in scope, initially weekly.**
12. **Screen-recording transcription is a gated phase, not an excuse for scraping.**
13. **Completed items remain searchable.**
14. **Portable export is required before production hardening is complete.**
15. **V1 acceptance is English-first while storage and retrieval remain multilingual-ready.**
16. **Weekly resurfacing is in-app only for V1.**
17. **Screen-recording originals purge after 30 days unless explicitly retained.**
18. **The pilot has a ₹2,500 monthly hard ceiling and targets less than ₹1,000.**
19. **X paid API access begins disabled.**
20. **GitHub is the code/release source of truth and Jira is the work/roadmap source of truth.**

### Decisions deferred until their delivery gate

- Regional language(s) and common transliteration patterns after the English-first pilot.
- A budget revision or validated backed-up alternative before moving from the free pilot to paid production.
- Whether the six-week review-engagement threshold justifies an iPhone Reminder.
- Whether observed X volume justifies an X developer application and paid access.
- Which secondary storage account should receive monthly exports.

These choices do not block Phase 0 or Phase 1.

---

## 25. Build-start checklist

Before writing application features:

- [ ] Initialize Git repository/branch policy if not already initialized.
- [ ] Create pnpm monorepo and pin Node/pnpm versions.
- [ ] Create Supabase local project and staging project.
- [ ] Validate migrations and RLS behavior against current official Supabase/Postgres guidance.
- [ ] Create Vercel staging project.
- [ ] Create OpenAI API project with a low spending limit; keep key server-side.
- [ ] Decide whether X API setup occurs in Phase 2 or uses metadata fallback initially.
- [ ] Create synthetic fixtures and the first recall queries.
- [ ] Implement RLS tests before storing real content.
- [ ] Implement capture and export design before AI enrichment.
- [ ] Test Save and Save Rich from Instagram, Photos, Safari, Files, and X.
- [ ] Record real capture-quality outcomes for the first 30 items.

The first implementation ticket should be:

> Scaffold the monorepo, local Supabase environment, CI, domain enums/schemas, initial migrations with RLS tests, and a synthetic seed library. Do not add OpenAI or Instagram fetching yet.

The second implementation ticket should be:

> Implement idempotent URL/text capture and signed file upload, then provide the exact iPhone Shortcut setup instructions and validate 30 durable captures before enrichment work begins.

---

## 26. Primary references

- [Meta verified Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Meta on unauthorized scraping](https://about.fb.com/news/2021/05/scraping-by-the-numbers/amp/)
- [Apple Shortcuts input types](https://support.apple.com/en-nz/guide/shortcuts/apd7644168e1/ios)
- [X Post Lookup](https://docs.x.com/x-api/posts/lookup/introduction)
- [X Bookmarks Lookup](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup)
- [X API pricing](https://docs.x.com/x-api/getting-started/pricing)
- [Supabase automatic embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings)
- [Supabase semantic search](https://supabase.com/docs/guides/ai/semantic-search)
- [Supabase pricing](https://supabase.com/pricing)
- [OpenAI Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- [OpenAI GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [OpenAI GPT-4o Mini Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe)
- [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [Google Cloud Run](https://cloud.google.com/run)
- [FFmpeg video processing on Cloud Run](https://docs.cloud.google.com/run/docs/tutorials/video-encoding)

---

## 27. Project delivery and operating system

### 27.1 Sources of truth

- Jira is authoritative for backlog, priority, dependencies, live status, releases, bugs, and enhancements.
- GitHub is authoritative for code, pull requests, CI, decisions, security findings, and release artifacts.
- This document is the approved product and architecture baseline.
- `CHANGELOG.md` records shipped user-visible behavior; `docs/status/` records weekly outcomes.
- Routine work is not duplicated in GitHub Issues. Actionable GitHub security findings become Jira bugs or tasks.

### 27.2 Jira configuration

Use the team-managed project named **Save Here**, key **SH**, with its build board as the delivery source of truth.

Releases:

- `0.1 Capture`
- `0.2 Understand`
- `0.3 Recall`
- `0.4 Act`
- `1.0 Personal Pilot`

Work types are Epic, Story, Task, Bug, Enhancement, and time-boxed Spike. Import the implementation backlog from `docs/jira/initial-backlog.csv`.

Workflow:

> Inbox → Ready → In Progress → Validate → Done

Use Blocked, Parked, and Won't Do for exceptional states. At most two items may be active across In Progress and Validate.

### 27.3 Prioritization

- P0: active data loss, credential exposure, or severe security incident.
- P1: capture loss, unusable retrieval, or the current phase-gate blocker.
- P2: committed high-value work.
- P3: planned improvement.
- P4: someday/maybe.

For P2–P4 order by:

`(User value + Risk reduction + Time criticality) × Confidence ÷ Effort`

Value is 1–5; risk reduction and time criticality are 0–3; confidence is 0.5, 0.8, or 1; effort is 0.5, 1, 2, 3, 5, or 8 ideal days.

### 27.4 Cadence and status

- Start of week: review metrics and blockers, triage Inbox, choose one weekly outcome, and replenish Ready.
- During work: update status when reality changes and record the next action on blocked items.
- End of week: demo completed behavior, validate acceptance criteria, publish the weekly status snapshot, and reorder the backlog.
- Monthly: review roadmap, cost, provider changes, graveyard metrics, and architecture decisions.
- After each release: publish a GitHub release and update `CHANGELOG.md`.

The weekly snapshot uses `docs/status/TEMPLATE.md` and records outcome, shipped, in progress, blocked, incidents, product metrics, cost, decisions, risks, and next outcome.

### 27.5 Ready and done

An item is Ready only when outcome, acceptance criteria, dependencies, risks, decision needs, and test approach are clear and the work is five ideal days or smaller.

An item is Done only when acceptance criteria and tests pass; privacy, degraded behavior, cost, and observability are checked; documentation is current; Jira links the pull request and release; relevant behavior is validated on a real iPhone; and no secret or private fixture entered Git.

Branches and pull requests begin with their Jira key, for example `SH-12-durable-capture`.

---

## 28. Final architecture principle

Instagram’s access restrictions are not an implementation bug to be bypassed. They are a product constraint to represent honestly.

The system should be excellent at preserving and finding whatever the owner explicitly shares, while making the quality of each capture visible. That produces a trustworthy, low-maintenance personal memory system without turning the owner’s Instagram account into a fragile scraping credential.
