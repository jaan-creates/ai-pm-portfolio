"""Check page bounds and extract text without persisting private PDF contents."""
import io
import sys
import pdfplumber

with pdfplumber.open(io.BytesIO(sys.stdin.buffer.read())) as document:
    if not document.pages:
        raise ValueError("Empty PDF")
    texts = []
    for page in document.pages:
        x0, top, x1, bottom = page.bbox
        if any(char["x0"] < x0 or char["x1"] > x1 or char["top"] < top or char["bottom"] > bottom for char in page.chars):
            raise ValueError("Text extends outside the page")
        texts.append(page.extract_text() or "")
sys.stdout.buffer.write("\n".join(texts).encode("utf-8"))
