import re
from typing import List, Optional, Tuple

from app.schemas.cv import CVProfile, Education, Project, WorkExperience

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")
URL_REGEX = re.compile(r"https?://(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*")

KNOWN_SKILLS = [
    "Python", "FastAPI", "Django", "Flask", "JavaScript", "TypeScript", "React",
    "Next.js", "Vue", "Node.js", "Express", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Git", "CI/CD",
    "REST API", "GraphQL", "Linux", "HTML", "CSS", "TailwindCSS", "Pandas", "NumPy",
    "PyTorch", "TensorFlow", "Scikit-Learn", "Java", "Spring Boot", "C++", "C#", ".NET",
    "Go", "Rust", "SQL", "OpenAI", "Prompt Engineering", "Microservices", "Kafka"
]


def extract_contact_info(text: str) -> Tuple[Optional[str], Optional[str], List[str]]:
    """Extract email, phone, and web links from text."""
    email_match = EMAIL_REGEX.search(text)
    email = email_match.group(0) if email_match else None

    # Filter out year spans like 2020-2024 from phone matches
    phone = None
    for match in PHONE_REGEX.finditer(text):
        p_candidate = match.group(0).strip()
        # Verify candidate has at least 8 digits
        digits_only = re.sub(r"\D", "", p_candidate)
        if 8 <= len(digits_only) <= 15:
            phone = p_candidate
            break

    links = URL_REGEX.findall(text)
    return email, phone, list(set(links))


def extract_candidate_name(lines: List[str]) -> Optional[str]:
    """Extract candidate name from initial lines."""
    for line in lines[:8]:
        cleaned = line.strip(" #*_-:|")
        if not cleaned:
            continue
        # Skip lines that are clearly headers or contact lines
        if "@" in cleaned or "http" in cleaned.lower() or "resume" in cleaned.lower() or "curriculum" in cleaned.lower():
            continue
        if len(cleaned.split()) >= 2 and len(cleaned) <= 40:
            return cleaned
    return None


def split_sections(text: str) -> dict[str, List[str]]:
    """Split CV text into logical sections based on common headers."""
    sections: dict[str, List[str]] = {
        "summary": [],
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
        "languages": [],
        "other": [],
    }

    section_keywords = {
        "summary": ["summary", "profile", "about me", "objective", "tóm tắt", "mục tiêu nghề nghiệp", "giới thiệu"],
        "skills": ["skills", "technical skills", "kỹ năng", "technologies", "core competencies", "competencies"],
        "experience": ["work experience", "experience", "kinh nghiệm làm việc", "kinh nghiệm", "employment history", "lịch sử làm việc"],
        "projects": ["projects", "personal projects", "dự án", "key projects"],
        "education": ["education", "học vấn", "bằng cấp", "trình độ học vấn", "đào tạo"],
        "certifications": ["certifications", "certificates", "chứng chỉ"],
        "languages": ["languages", "ngôn ngữ", "ngoại ngữ"],
    }

    current_section = "other"
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        lower_line = line.lower().strip("#* :_-")
        matched_section = None
        for sec_name, keywords in section_keywords.items():
            if any(lower_line == kw or lower_line.startswith(kw + ":") for kw in keywords):
                matched_section = sec_name
                break

        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)

    return sections


def parse_cv_profile(text: str) -> CVProfile:
    """Parse raw CV text into structured CVProfile using heuristics and regex."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    email, phone, links = extract_contact_info(text)
    name = extract_candidate_name(lines)

    sections = split_sections(text)

    # 1. Summary
    summary_text = " ".join(sections["summary"]).strip() if sections["summary"] else None

    # 2. Skills
    extracted_skills: set[str] = set()
    skills_text = " ".join(sections["skills"])
    for skill in KNOWN_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", text, re.IGNORECASE):
            extracted_skills.add(skill)

    # Also parse comma-delimited or bullet-point items in the skills section
    for line in sections["skills"]:
        parts = re.split(r"[,•|\-–—]", line)
        for part in parts:
            item = part.strip()
            if 2 <= len(item) <= 30 and not any(c in item for c in "@:/\\"):
                extracted_skills.add(item)

    # 3. Work Experience
    work_experiences: List[WorkExperience] = []
    exp_lines = sections["experience"]
    if exp_lines:
        current_exp: Optional[WorkExperience] = None
        for line in exp_lines:
            if line.startswith(("-", "*", "•")):
                cleaned_resp = line.lstrip("-*• ").strip()
                if current_exp:
                    current_exp.responsibilities.append(cleaned_resp)
            else:
                # Potential title or company line
                if not current_exp:
                    current_exp = WorkExperience(company="Company", title=line, dates=None)
                else:
                    if len(current_exp.responsibilities) > 0:
                        work_experiences.append(current_exp)
                        current_exp = WorkExperience(company=line, title=line, dates=None)
                    else:
                        current_exp.company = line
        if current_exp:
            work_experiences.append(current_exp)

    # 4. Projects
    projects: List[Project] = []
    proj_lines = sections["projects"]
    if proj_lines:
        current_proj: Optional[Project] = None
        for line in proj_lines:
            if line.startswith(("-", "*", "•")):
                cleaned_contrib = line.lstrip("-*• ").strip()
                if current_proj:
                    current_proj.contributions.append(cleaned_contrib)
            else:
                if current_proj and current_proj.name:
                    projects.append(current_proj)
                current_proj = Project(
                    name=line.strip("#* :"),
                    description=line,
                    technologies=[s for s in KNOWN_SKILLS if s.lower() in line.lower()],
                )
        if current_proj:
            projects.append(current_proj)

    # 5. Education
    education_entries: List[Education] = []
    edu_lines = sections["education"]
    for line in edu_lines:
        if not line.startswith(("-", "*", "•")):
            education_entries.append(Education(institution=line, degree=line, dates=None))

    # 6. Certifications
    certifications = [line.lstrip("-*• ").strip() for line in sections["certifications"] if line.strip()]

    # 7. Languages
    languages = [line.lstrip("-*• ").strip() for line in sections["languages"] if line.strip()]

    return CVProfile(
        name=name,
        email=email,
        phone=phone,
        location=None,
        summary=summary_text,
        skills=sorted(list(extracted_skills)),
        work_experience=work_experiences,
        projects=projects,
        education=education_entries,
        certifications=certifications,
        languages=languages,
        links=links,
    )
