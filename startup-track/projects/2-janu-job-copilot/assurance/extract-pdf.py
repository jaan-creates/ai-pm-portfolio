"""Extract text from a private submission candidate without persisting its contents."""
import io
import sys
from pypdf import PdfReader

reader = PdfReader(io.BytesIO(sys.stdin.buffer.read()), strict=True)
if reader.is_encrypted or not reader.pages:
    raise ValueError("Unreadable or empty PDF")
text = "\n".join(page.extract_text() or "" for page in reader.pages)
sys.stdout.buffer.write(text.encode("utf-8"))
