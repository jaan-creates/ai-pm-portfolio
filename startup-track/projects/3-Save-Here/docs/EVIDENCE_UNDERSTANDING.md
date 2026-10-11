## Evidence understanding contract

Evidence is captured privately before enrichment. OCR, transcription, and visual labels are asynchronous and provider-neutral. Generated summaries and tags record provenance and confidence; blank evidence produces no invented meaning. Job payloads contain only asset id, role, and MIME type—never bytes, cookies, tokens, or credentials.

Provider integration follows the bounded job state machine: queued → processing → succeeded, or retryable → failed after three attempts. Capture remains successful if the queue or provider is unavailable.
