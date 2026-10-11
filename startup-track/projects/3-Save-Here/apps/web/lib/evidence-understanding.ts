export type EvidenceKind = "screenshot" | "image" | "pdf" | "recording";

export type EvidenceUnderstandingInput = {
  mimeType: string;
  role: EvidenceKind;
  /** OCR/transcript text supplied by a trusted extractor. Never invent text here. */
  extractedText?: string | null;
  /** Optional provider-generated visual labels. */
  visualLabels?: string[] | null;
  sourceName?: string | null;
};

export type EvidenceUnderstanding = {
  summary: string | null;
  suggestedTags: string[];
  searchableText: string;
  provenance: {
    source: "ocr" | "vision" | "filename" | "none";
    confidence: number;
    extractedAt: string | null;
  };
};

const STOP_WORDS = new Set(["the", "and", "for", "with", "this", "that", "from", "your", "you", "are", "was", "has", "have", "http", "https"]);

function cleanToken(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, "").trim();
}

function topTokens(value: string, limit = 8) {
  const counts = new Map<string, number>();
  for (const raw of value.split(/\s+/u)) {
    const token = cleanToken(raw);
    if (token.length < 3 || STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([token]) => token);
}

function normalizeLabels(labels: string[]) {
  return labels.map(cleanToken).filter(Boolean).filter((label, index, all) => all.indexOf(label) === index).slice(0, 10);
}

/**
 * Converts evidence extractor output into a stable, explainable recall payload.
 * This is intentionally provider-neutral: OCR/vision/transcription can be added
 * behind the same contract without changing storage or search behavior.
 */
export function buildEvidenceUnderstanding(input: EvidenceUnderstandingInput, extractedAt = new Date().toISOString()): EvidenceUnderstanding {
  const text = (input.extractedText ?? "").replace(/\s+/gu, " ").trim();
  const labels = normalizeLabels(input.visualLabels ?? []);
  const filenameTokens = topTokens(input.sourceName ?? "", 4);
  const textTokens = topTokens(text);
  const suggestedTags = [...labels, ...textTokens, ...filenameTokens].filter((tag, index, all) => all.indexOf(tag) === index).slice(0, 12);
  const source = text ? "ocr" : labels.length ? "vision" : filenameTokens.length ? "filename" : "none";
  const confidence = source === "ocr" ? 0.8 : source === "vision" ? 0.65 : source === "filename" ? 0.35 : 0;
  return {
    summary: text ? text.slice(0, 280) : labels.length ? labels.join(" · ") : null,
    suggestedTags,
    searchableText: [text, labels.join(" "), filenameTokens.join(" ")].filter(Boolean).join(" ").slice(0, 4000),
    provenance: { source, confidence, extractedAt: source === "none" ? null : extractedAt },
  };
}
