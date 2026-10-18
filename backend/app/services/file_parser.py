import io
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import docx
except ImportError:
    docx = None


@dataclass
class ExtractedText:
    text: str
    page_count: int
    char_count: int
    warnings: List[str] = field(default_factory=list)
    is_truncated: bool = False


@dataclass
class ValidationResult:
    is_valid: bool
    error_message: Optional[str] = None
    detected_format: Optional[str] = None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and remove unsafe chars."""
    if not filename:
        return "unnamed_file"
    # Take only the basename, remove path traversal components
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[\\/*?:"<>|]', "", clean_name)
    clean_name = clean_name.strip(" .")
    return clean_name or "unnamed_file"


def validate_file(
    filename: str,
    content_type: Optional[str],
    file_bytes: bytes,
    max_size_bytes: int = 10 * 1024 * 1024,
) -> ValidationResult:
    """Validate file size, extension, and magic bytes."""
    if not file_bytes or len(file_bytes) == 0:
        return ValidationResult(is_valid=False, error_message="File is empty (0 bytes).")

    if len(file_bytes) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        return ValidationResult(
            is_valid=False,
            error_message=f"File exceeds maximum allowed size of {max_mb}MB.",
        )

    clean_name = sanitize_filename(filename)
    ext = Path(clean_name).suffix.lower()

    # Allowed extensions
    allowed_extensions = {".pdf", ".docx", ".txt"}
    if ext not in allowed_extensions:
        return ValidationResult(
            is_valid=False,
            error_message=f"Unsupported file extension '{ext}'. Allowed: .pdf, .docx, .txt",
        )

    # Magic byte checks
    if ext == ".pdf":
        if not file_bytes.startswith(b"%PDF-"):
            return ValidationResult(
                is_valid=False,
                error_message="Invalid PDF file format (missing PDF magic header).",
                detected_format="pdf",
            )
        return ValidationResult(is_valid=True, detected_format="pdf")

    if ext == ".docx":
        # ZIP archive magic bytes (PK\x03\x04)
        if not file_bytes.startswith(b"PK\x03\x04"):
            return ValidationResult(
                is_valid=False,
                error_message="Invalid DOCX file format (missing ZIP magic header).",
                detected_format="docx",
            )
        return ValidationResult(is_valid=True, detected_format="docx")

    if ext == ".txt":
        # Validate that bytes can be decoded as text
        try:
            file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                file_bytes.decode("latin-1")
            except Exception:
                return ValidationResult(
                    is_valid=False,
                    error_message="Invalid text file: cannot decode contents.",
                    detected_format="txt",
                )
        return ValidationResult(is_valid=True, detected_format="txt")

    return ValidationResult(is_valid=False, error_message="Unknown file format.")


def extract_text_from_pdf(file_bytes: bytes, max_chars: int = 60000) -> ExtractedText:
    """Extract text from PDF file bytes using PyMuPDF (fitz)."""
    if fitz is None:
        raise RuntimeError("PyMuPDF (fitz) is not installed.")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Failed to parse PDF: Corrupted or invalid PDF format. ({str(exc)})")

    try:
        if doc.is_encrypted or doc.needs_pass:
            raise ValueError("File is password-protected and cannot be read.")

        page_count = len(doc)
        if page_count == 0:
            return ExtractedText(
                text="",
                page_count=0,
                char_count=0,
                warnings=["PDF document contains no pages."],
                is_truncated=False,
            )

        extracted_pages: List[str] = []
        for i, page in enumerate(doc):
            extracted_pages.append(page.get_text("text"))

        full_text = "\n\n".join(extracted_pages).strip()
        warnings: List[str] = []

        # Check for scanned / image-based PDF
        if page_count > 0 and len(full_text) < 50:
            warnings.append(
                "Scanned or image-based PDF detected. Very little text could be extracted. "
                "Consider converting to text or using an OCR tool."
            )

        is_truncated = False
        if len(full_text) > max_chars:
            full_text = full_text[:max_chars]
            is_truncated = True
            warnings.append(f"Extracted text truncated to {max_chars} characters.")

        return ExtractedText(
            text=full_text,
            page_count=page_count,
            char_count=len(full_text),
            warnings=warnings,
            is_truncated=is_truncated,
        )
    finally:
        doc.close()


def extract_text_from_docx(file_bytes: bytes, max_chars: int = 60000) -> ExtractedText:
    """Extract text from DOCX file bytes using python-docx."""
    if docx is None:
        raise RuntimeError("python-docx is not installed.")

    try:
        doc = docx.Document(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Failed to parse DOCX: Corrupted or invalid DOCX format. ({str(exc)})")

    paragraphs_text = [p.text for p in doc.paragraphs if p.text.strip()]

    # Also extract text from tables
    table_text: List[str] = []
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                table_text.append(" | ".join(row_cells))

    all_content = paragraphs_text + table_text
    full_text = "\n\n".join(all_content).strip()
    warnings: List[str] = []

    if len(full_text) == 0:
        warnings.append("DOCX document contains no text.")

    is_truncated = False
    if len(full_text) > max_chars:
        full_text = full_text[:max_chars]
        is_truncated = True
        warnings.append(f"Extracted text truncated to {max_chars} characters.")

    return ExtractedText(
        text=full_text,
        page_count=1,  # DOCX has no explicit page count without rendering
        char_count=len(full_text),
        warnings=warnings,
        is_truncated=is_truncated,
    )


def extract_text_from_txt(file_bytes: bytes, max_chars: int = 60000) -> ExtractedText:
    """Extract text from plain text bytes."""
    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="replace")

    text = text.strip()
    warnings: List[str] = []
    if len(text) == 0:
        warnings.append("Text file is empty.")

    is_truncated = False
    if len(text) > max_chars:
        text = text[:max_chars]
        is_truncated = True
        warnings.append(f"Extracted text truncated to {max_chars} characters.")

    return ExtractedText(
        text=text,
        page_count=1,
        char_count=len(text),
        warnings=warnings,
        is_truncated=is_truncated,
    )


def extract_text(
    filename: str,
    file_bytes: bytes,
    max_chars: int = 60000,
) -> ExtractedText:
    """Detect file type and extract text accordingly."""
    clean_name = sanitize_filename(filename)
    ext = Path(clean_name).suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes, max_chars=max_chars)
    elif ext == ".docx":
        return extract_text_from_docx(file_bytes, max_chars=max_chars)
    elif ext == ".txt":
        return extract_text_from_txt(file_bytes, max_chars=max_chars)
    else:
        raise ValueError(f"Unsupported file type '{ext}' for text extraction.")
