import { buildEvidenceUnderstanding, type EvidenceUnderstanding } from "./evidence-understanding";

export type EvidenceJobState = "queued" | "processing" | "succeeded" | "retryable" | "failed";

export type EvidenceJob = {
  id: string;
  itemId: string;
  assetId: string;
  attempt: number;
  maxAttempts: number;
  state: EvidenceJobState;
  provider: "none" | "ocr" | "vision" | "transcription";
  role: "image" | "pdf" | "recording";
  errorCode?: string;
};

export type EvidenceProviderResult = {
  extractedText?: string | null;
  visualLabels?: string[] | null;
  sourceName?: string | null;
};

/**
 * Creates a deterministic job envelope. Storage and queue adapters call this
 * before contacting a provider so capture remains independent of enrichment.
 */
export function createEvidenceJob(input: { itemId: string; assetId: string; mimeType: string; jobId?: string }): EvidenceJob {
  const provider = input.mimeType.startsWith("video/") ? "transcription" : input.mimeType.startsWith("image/") || input.mimeType === "application/pdf" ? "vision" : "none";
  return {
    id: input.jobId ?? crypto.randomUUID(),
    itemId: input.itemId,
    assetId: input.assetId,
    attempt: 0,
    maxAttempts: 3,
    state: "queued",
    provider,
    role: input.mimeType.startsWith("video/") ? "recording" : input.mimeType === "application/pdf" ? "pdf" : "image",
  };
}

export function markEvidenceJobProcessing(job: EvidenceJob): EvidenceJob {
  if (job.state !== "queued" && job.state !== "retryable") throw new Error("job_not_ready");
  return { ...job, state: "processing", attempt: job.attempt + 1 };
}

export function completeEvidenceJob(job: EvidenceJob, result: EvidenceProviderResult, extractedAt?: string): { job: EvidenceJob; understanding: EvidenceUnderstanding } {
  if (job.state !== "processing") throw new Error("job_not_processing");
  return {
    job: { ...job, state: "succeeded", errorCode: undefined },
    understanding: buildEvidenceUnderstanding({
      role: job.role,
      mimeType: job.role === "recording" ? "video/mp4" : job.role === "pdf" ? "application/pdf" : "image/jpeg",
      extractedText: result.extractedText,
      visualLabels: result.visualLabels,
      sourceName: result.sourceName,
    }, extractedAt),
  };
}

export function failEvidenceJob(job: EvidenceJob, errorCode: string): EvidenceJob {
  if (job.state !== "processing") throw new Error("job_not_processing");
  return { ...job, state: job.attempt < job.maxAttempts ? "retryable" : "failed", errorCode };
}
