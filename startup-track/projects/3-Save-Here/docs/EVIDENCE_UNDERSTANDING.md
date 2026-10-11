# Evidence understanding contract

Uploaded screenshots, images, PDFs, and recordings are durable evidence first. Understanding is asynchronous and must remain truthful when a source is private or unavailable.

The evidence-understanding module defines a provider-neutral boundary:

1. OCR/transcription can provide extractedText.
2. Vision can provide visualLabels.
3. A filename is a weak last-resort hint.
4. The result stores a short summary, deduplicated suggested tags, searchable text, source provenance, confidence, and extraction time.
5. A blank asset produces no invented title or tags.

The next integration should call this contract from a bounded background job, persist the result into items.ai_metadata and item_chunks, and retain the original evidence path. Provider failures must leave the item captured and retryable. User corrections must override generated fields.

This contract intentionally does not select an OCR/vision vendor or send private evidence anywhere. The provider decision is a separate, cost-gated spike.
