import re
from typing import List, Optional, Tuple

from app.schemas.common import Priority
from app.schemas.jd import JDAnalysis, JDRequirement

SENIORITY_KEYWORDS = {
    "Intern": ["intern", "thực tập sinh"],
    "Fresher": ["fresher", "mới tốt nghiệp"],
    "Junior": ["junior", "entry level", "1-2 years", "1 năm", "2 năm"],
    "Mid-Level": ["middle", "mid-level", "mid level", "2-4 years", "3+ years"],
    "Senior": ["senior", "chuyên viên cao cấp", "5+ years", "4+ years"],
    "Lead / Principal": ["lead", "trưởng nhóm", "principal", "staff engineer", "architect"],
    "Manager / Director": ["manager", "quản lý", "director", "head of"],
}

INDUSTRY_KEYWORDS = {
    "Information Technology": ["software", "technology", "saas", "cloud", "it", "công nghệ thông tin", "phần mềm"],
    "Fintech & Banking": ["fintech", "banking", "finance", "ngân hàng", "tài chính", "payment"],
    "E-commerce": ["ecommerce", "e-commerce", "thương mại điện tử", "retail"],
    "Healthcare": ["health", "medical", "y tế", "healthcare"],
    "Education": ["education", "edtech", "giáo dục"],
}


def detect_seniority(text: str) -> Optional[str]:
    """Detect candidate seniority level from JD text."""
    lower_text = text.lower()
    for level, keywords in SENIORITY_KEYWORDS.items():
        if any(re.search(rf"\b{re.escape(kw)}\b", lower_text) for kw in keywords):
            return level
    return "Mid-Level"


def detect_industry(text: str) -> Optional[str]:
    """Detect industry domain from JD text."""
    lower_text = text.lower()
    for ind, keywords in INDUSTRY_KEYWORDS.items():
        if any(re.search(rf"\b{re.escape(kw)}\b", lower_text) for kw in keywords):
            return ind
    return "Information Technology"


def extract_job_title(lines: List[str]) -> Optional[str]:
    """Extract job title from the first lines of the JD."""
    title_indicators = ["vị trí", "job title", "role", "position", "chức danh"]
    for line in lines[:8]:
        cleaned = line.strip("#* :_-")
        if not cleaned:
            continue
        lower_line = cleaned.lower()
        for ind in title_indicators:
            if ind in lower_line:
                parts = re.split(r"[:\-|]", cleaned)
                if len(parts) > 1:
                    return parts[1].strip()
                return cleaned
        if any(kw in lower_line for kw in ["engineer", "developer", "kỹ sư", "analyst", "designer", "manager", "specialist"]):
            return cleaned

    # Fallback to the first non-empty line
    if lines:
        return lines[0].strip("#* :_-")
    return "Software Engineer"


def categorize_requirement(req_text: str) -> Tuple[str, Priority]:
    """Determine category and priority from requirement text."""
    lower = req_text.lower()

    # Determine priority
    if any(k in lower for k in ["nice to have", "plus", "lợi thế", "ưu tiên điểm cộng", "optional"]):
        priority = Priority.NICE_TO_HAVE
    elif any(k in lower for k in ["preferred", "ưu tiên", "desirable", "good to have", "khuyến khích"]):
        priority = Priority.PREFERRED
    else:
        priority = Priority.REQUIRED

    # Determine category
    if any(k in lower for k in ["degree", "bachelor", "master", "university", "đại học", "bằng cấp"]):
        category = "Education"
    elif any(k in lower for k in ["years of experience", "năm kinh nghiệm", "kinh nghiệm làm việc", "proven experience"]):
        category = "Experience"
    elif any(k in lower for k in ["communication", "teamwork", "giao tiếp", "làm việc nhóm", "problem solving", "giải quyết vấn đề"]):
        category = "Soft Skills"
    elif any(k in lower for k in ["english", "tiếng anh", "japanese", "tiếng nhật", "language", "ielts", "toeic"]):
        category = "Languages"
    else:
        category = "Technical"

    return category, priority


def parse_jd_analysis(text: str) -> JDAnalysis:
    """Parse raw JD text into structured JDAnalysis with stable requirement IDs."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    job_title = extract_job_title(lines)
    seniority = detect_seniority(text)
    industry = detect_industry(text)

    requirements: List[JDRequirement] = []
    req_counter = 1

    current_section = "General Requirements"
    for line in lines:
        cleaned = line.strip()
        lower = cleaned.lower()

        # Check if line is a section header
        if any(h in lower for h in [
            "yêu cầu công việc", "requirements", "qualifications", "must have", "kỹ năng yêu cầu",
            "mô tả công việc", "responsibilities", "nice to have", "ưu tiên"
        ]) and len(cleaned) < 50:
            current_section = cleaned.strip("#* :_-")
            continue

        # Check if line is a bullet point or requirement sentence
        if cleaned.startswith(("-", "*", "•", "+", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "10.")):
            req_text = re.sub(r"^[-*•+\d.]\s*", "", cleaned).strip()
            if len(req_text) >= 10:
                category, priority = categorize_requirement(req_text)
                # If section header itself specifies nice-to-have or preferred, honor it
                if any(k in current_section.lower() for k in ["nice to have", "plus", "lợi thế"]):
                    priority = Priority.NICE_TO_HAVE
                elif any(k in current_section.lower() for k in ["preferred", "ưu tiên"]):
                    priority = Priority.PREFERRED

                requirements.append(
                    JDRequirement(
                        id=f"REQ-{req_counter:03d}",
                        description=req_text,
                        priority=priority,
                        category=category,
                        source_context=current_section,
                    )
                )
                req_counter += 1

    # Fallback if no bullet points found: treat sentences as requirements
    if not requirements:
        sentences = [s.strip() for s in re.split(r"[.\n]", text) if len(s.strip()) > 20]
        for s in sentences[:10]:
            category, priority = categorize_requirement(s)
            requirements.append(
                JDRequirement(
                    id=f"REQ-{req_counter:03d}",
                    description=s,
                    priority=priority,
                    category=category,
                    source_context=current_section,
                )
            )
            req_counter += 1

    return JDAnalysis(
        job_title=job_title,
        seniority=seniority,
        industry=industry,
        requirements=requirements,
    )
