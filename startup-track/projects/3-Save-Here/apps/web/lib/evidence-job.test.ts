import { describe, expect, it } from "vitest";
import { completeEvidenceJob, createEvidenceJob, failEvidenceJob, markEvidenceJobProcessing } from "./evidence-job";

describe("evidence processing jobs", () => {
  it("keeps capture and provider work separate", () => {
    const queued = createEvidenceJob({ itemId: "item-1", assetId: "asset-1", mimeType: "image/png", jobId: "job-1" });
    expect(queued).toMatchObject({ state: "queued", provider: "vision", role: "image", attempt: 0, maxAttempts: 3 });
    const processing = markEvidenceJobProcessing(queued);
    expect(processing).toMatchObject({ state: "processing", attempt: 1 });
    const completed = completeEvidenceJob(processing, { extractedText: "A recipe for oats", visualLabels: ["food"] }, "2026-10-11T00:00:00.000Z");
    expect(completed.job.state).toBe("succeeded");
    expect(completed.understanding.suggestedTags).toEqual(expect.arrayContaining(["recipe", "oats", "food"]));
  });

  it("retries transient provider failures and dead-letters after the bound", () => {
    let job = markEvidenceJobProcessing(createEvidenceJob({ itemId: "item-1", assetId: "asset-1", mimeType: "video/mp4", jobId: "job-1" }));
    job = failEvidenceJob(job, "provider_timeout");
    expect(job.state).toBe("retryable");
    job = markEvidenceJobProcessing(job);
    job = failEvidenceJob(job, "provider_timeout");
    job = markEvidenceJobProcessing(job);
    job = failEvidenceJob(job, "provider_timeout");
    expect(job.state).toBe("failed");
    expect(job.attempt).toBe(3);
  });

  it("rejects invalid state transitions", () => {
    const job = createEvidenceJob({ itemId: "item-1", assetId: "asset-1", mimeType: "image/png" });
    expect(() => completeEvidenceJob(job, {})).toThrow("job_not_processing");
    expect(() => failEvidenceJob(job, "unknown")).toThrow("job_not_processing");
  });
});
