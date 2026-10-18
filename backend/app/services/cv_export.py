import io
from typing import List, Optional
try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    docx = None

from app.schemas.analysis import RevisionSuggestion
from app.schemas.cv import CVProfile


def generate_docx_cv(
    cv_profile: CVProfile,
    approved_suggestion_ids: List[str],
    suggestions: List[RevisionSuggestion],
) -> bytes:
    """
    Generate a clean, structured DOCX CV incorporating approved revision suggestions.
    """
    if not DOCX_AVAILABLE or docx is None:
        raise RuntimeError("python-docx is not installed.")

    doc = docx.Document()

    # Page margin settings
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    approved_set = set(approved_suggestion_ids)
    approved_suggestions = [s for s in suggestions if s.id in approved_set]

    # Map suggestions by section or target text
    summary_suggestions = [s for s in approved_suggestions if "summary" in s.section.lower()]
    experience_suggestions = [s for s in approved_suggestions if "experience" in s.section.lower()]

    # 1. Header: Name & Contact
    name_heading = doc.add_paragraph()
    name_run = name_heading.add_run(cv_profile.name or "Candidate Name")
    name_run.bold = True
    name_run.font.size = Pt(20)
    name_run.font.color.rgb = RGBColor(30, 58, 138)

    contact_parts: List[str] = []
    if cv_profile.email:
        contact_parts.append(cv_profile.email)
    if cv_profile.phone:
        contact_parts.append(cv_profile.phone)
    if cv_profile.location:
        contact_parts.append(cv_profile.location)
    if cv_profile.links:
        contact_parts.extend(cv_profile.links[:2])

    if contact_parts:
        contact_para = doc.add_paragraph(" | ".join(contact_parts))
        contact_para.runs[0].font.size = Pt(9.5)
        contact_para.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 2. Professional Summary
    summary_text = cv_profile.summary or ""
    if summary_suggestions:
        # Use latest approved suggestion for summary
        summary_text = summary_suggestions[-1].proposed_text

    if summary_text:
        h_sum = doc.add_heading("PROFESSIONAL SUMMARY", level=2)
        h_sum.runs[0].font.size = Pt(12)
        h_sum.runs[0].font.color.rgb = RGBColor(30, 41, 59)
        p_sum = doc.add_paragraph(summary_text)
        p_sum.paragraph_format.line_spacing = 1.15

    # 3. Work Experience
    if cv_profile.work_experience:
        h_exp = doc.add_heading("WORK EXPERIENCE", level=2)
        h_exp.runs[0].font.size = Pt(12)
        h_exp.runs[0].font.color.rgb = RGBColor(30, 41, 59)

        for exp in cv_profile.work_experience:
            role_p = doc.add_paragraph()
            title_run = role_p.add_run(f"{exp.title or 'Role'}")
            title_run.bold = True
            if exp.company:
                comp_run = role_p.add_run(f" — {exp.company}")
                comp_run.font.italic = True
            if exp.dates:
                date_run = role_p.add_run(f" ({exp.dates})")
                date_run.font.color.rgb = RGBColor(100, 116, 139)

            for resp in exp.responsibilities:
                doc.add_paragraph(resp, style="List Bullet")

            for ach in exp.achievements:
                doc.add_paragraph(f"Achievement: {ach}", style="List Bullet")

        # If there are approved experience suggestions, add them
        if experience_suggestions:
            rev_p = doc.add_paragraph()
            rev_run = rev_p.add_run("Optimized Highlights (Approved Revisions):")
            rev_run.bold = True
            rev_run.font.italic = True
            for exp_sug in experience_suggestions:
                doc.add_paragraph(exp_sug.proposed_text, style="List Bullet")

    # 4. Technical Skills
    if cv_profile.skills:
        h_sk = doc.add_heading("TECHNICAL SKILLS", level=2)
        h_sk.runs[0].font.size = Pt(12)
        h_sk.runs[0].font.color.rgb = RGBColor(30, 41, 59)
        doc.add_paragraph(", ".join(cv_profile.skills))

    # 5. Projects
    if cv_profile.projects:
        h_proj = doc.add_heading("KEY PROJECTS", level=2)
        h_proj.runs[0].font.size = Pt(12)
        h_proj.runs[0].font.color.rgb = RGBColor(30, 41, 59)

        for proj in cv_profile.projects:
            proj_p = doc.add_paragraph()
            p_name = proj_p.add_run(proj.name or "Project")
            p_name.bold = True
            if proj.technologies:
                p_tech = proj_p.add_run(f" [{', '.join(proj.technologies)}]")
                p_tech.font.color.rgb = RGBColor(71, 85, 105)
            if proj.description:
                doc.add_paragraph(proj.description)
            for contrib in proj.contributions:
                doc.add_paragraph(contrib, style="List Bullet")

    # 6. Education & Certifications
    if cv_profile.education or cv_profile.certifications:
        h_edu = doc.add_heading("EDUCATION & CERTIFICATIONS", level=2)
        h_edu.runs[0].font.size = Pt(12)
        h_edu.runs[0].font.color.rgb = RGBColor(30, 41, 59)

        for edu in cv_profile.education:
            deg = f"{edu.degree} in {edu.field}" if (edu.degree and edu.field) else (edu.degree or edu.institution or "Degree")
            edu_p = doc.add_paragraph()
            edu_run = edu_p.add_run(deg)
            edu_run.bold = True
            if edu.institution and deg != edu.institution:
                inst_run = edu_p.add_run(f", {edu.institution}")
                inst_run.font.italic = True
            if edu.dates:
                edu_p.add_run(f" ({edu.dates})")

        for cert in cv_profile.certifications:
            doc.add_paragraph(f"Certification: {cert}", style="List Bullet")

    # Save to in-memory buffer
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
