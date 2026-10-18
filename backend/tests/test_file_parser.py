import io
import pytest

from app.services.file_parser import (
    extract_text,
    extract_text_from_docx,
    extract_text_from_pdf,
    extract_text_from_txt,
    sanitize_filename,
    validate_file,
)

try:
    import fitz
except ImportError:
    fitz = None

try:
    import docx
except ImportError:
    docx = None


def create_minimal_pdf(text: str = "Candidate CV Content") -> bytes:
    """Generate in-memory PDF with text using PyMuPDF."""
    if fitz is None:
        pytest.skip("PyMuPDF is not installed")
    doc = fitz.open()
    page = doc.new_page()
    if text:
        page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_minimal_docx(text: str = "Candidate CV Content") -> bytes:
    """Generate in-memory DOCX with text using python-docx."""
    if docx is None:
        pytest.skip("python-docx is not installed")
    doc = docx.Document()
    if text:
        doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_sanitize_filename() -> None:
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("normal_file.pdf") == "normal_file.pdf"
    assert sanitize_filename("") == "unnamed_file"


def test_validate_empty_file() -> None:
    res = validate_file("empty.pdf", "application/pdf", b"")
    assert not res.is_valid
    assert "empty" in res.error_message.lower()


def test_validate_oversized_file() -> None:
    # 10 bytes limit
    res = validate_file("large.pdf", "application/pdf", b"%PDF-1.4 1234567890", max_size_bytes=10)
    assert not res.is_valid
    assert "exceeds maximum" in res.error_message.lower()


def test_validate_wrong_extension() -> None:
    res = validate_file("malicious.exe", "application/x-msdownload", b"MZ123456")
    assert not res.is_valid
    assert "unsupported file extension" in res.error_message.lower()


def test_validate_invalid_pdf_header() -> None:
    res = validate_file("fake.pdf", "application/pdf", b"This is not a pdf file at all")
    assert not res.is_valid
    assert "invalid pdf" in res.error_message.lower()


def test_validate_invalid_docx_header() -> None:
    res = validate_file("fake.docx", "application/vnd.openxmlformats", b"Not a zip file")
    assert not res.is_valid
    assert "invalid docx" in res.error_message.lower()


def test_extract_text_from_pdf() -> None:
    pdf_bytes = create_minimal_pdf("John Doe\nPython Developer with 5 years experience.")
    extracted = extract_text_from_pdf(pdf_bytes)
    assert "John Doe" in extracted.text
    assert "Python Developer" in extracted.text
    assert extracted.page_count >= 1
    assert extracted.char_count > 0


def test_extract_text_from_scanned_pdf() -> None:
    # Blank PDF with no text -> should flag as scanned / insufficient text
    blank_pdf = create_minimal_pdf(text="")
    extracted = extract_text_from_pdf(blank_pdf)
    assert extracted.page_count == 1
    assert any("scanned" in w.lower() for w in extracted.warnings)


def test_extract_text_from_docx() -> None:
    docx_bytes = create_minimal_docx("Jane Doe\nFastAPI and Docker specialist.")
    extracted = extract_text_from_docx(docx_bytes)
    assert "Jane Doe" in extracted.text
    assert "FastAPI" in extracted.text
    assert extracted.char_count > 0


def test_extract_text_from_txt() -> None:
    txt_bytes = "Plain text resume\nSkills: Python, SQL".encode("utf-8")
    extracted = extract_text_from_txt(txt_bytes)
    assert "Plain text resume" in extracted.text
    assert extracted.char_count > 0


def test_extract_text_dispatcher() -> None:
    txt_bytes = "Dispatcher test resume content".encode("utf-8")
    res = extract_text("resume.txt", txt_bytes)
    assert "Dispatcher test" in res.text
