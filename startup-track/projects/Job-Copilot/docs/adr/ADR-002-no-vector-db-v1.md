# ADR-002 — No vector database in v1; embeddings in one narrow role only

**Status:** Accepted · 2026-07-21

## Context
"Match this resume to this job" invites a vector-database reflex (embed everything, semantic search). At single-user scale — tens of jobs/day scored against ONE master resume — that reflex solves a problem we don't have.

## Decision
Primary match scoring is LLM rubric reasoning (S1) + requirement coverage (S2) — no vectors involved. Embeddings appear in exactly one place: **S3 synonym coverage**, computed on-the-fly per job (embed the JD's key phrases + the resume's phrases once, cosine-compare in the script, cache the resume-side embeddings as JSON/SQLite blobs). Storage layer is SQLite + files. No Pinecone/Chroma/pgvector, no embedding index, no RAG.

## Reasoning
- At single-user scale there is no retrieval problem — every job is scored against the one master resume directly; a vector index accelerates search over corpora we don't have.
- SimHash (autopsy transplant #3) already handles near-duplicate/repost detection without embeddings.
- Research basis: embedding similarity alone under-measures fit versus rubric reasoning; its honest role here is the small S3 signal — already capped at 15% and subordinate to the terminology-without-evidence refusal rule.

## Rejected alternative
pgvector/Chroma-backed semantic scoring or semantic job search — parked, with a defined re-entry: if/when the accumulated corpus exceeds ~1–2k jobs AND the operator demonstrably wants "find me jobs like this one" search, add pgvector at the hosted-Postgres layer (one migration, no re-architecture — itself a reason SQLite→Postgres was chosen).

## Consequences
The golden-set harness stores results as plain files (optionally a SQLite index); it introduces no vector dependency. S3 stays a capped, evidence-subordinate signal.
