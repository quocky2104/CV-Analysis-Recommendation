import unicodedata
from typing import Optional

try:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

    class FPDF:  # type: ignore
        def __init__(self, *args, **kwargs):
            pass

    class XPos:  # type: ignore
        LMARGIN = RIGHT = 0

    class YPos:  # type: ignore
        NEXT = TOP = 0

from app.schemas.analysis import AnalysisResponse


def safe_text(text: Optional[str]) -> str:
    """
    Ensure text is safe for standard PDF core fonts (Latin-1).
    Transliterates accented characters (e.g., Vietnamese) to base ASCII equivalents.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", text)
    safe = "".join(c for c in normalized if not unicodedata.combining(c))
    # Map special Vietnamese 'd'/'D' stroke
    safe = safe.replace("đ", "d").replace("Đ", "D")
    return safe.encode("latin-1", "replace").decode("latin-1")


class PDFReport(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(50, 70, 120)
        self.cell(
            0,
            8,
            "CVision AI - CV & Job Matching Analysis Report",
            border=0,
            align="L",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(
            0,
            10,
            f"Page {self.page_no()}/{{nb}} | CVision AI Evaluation Engine",
            align="C",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )


def generate_pdf_report(analysis: AnalysisResponse) -> bytes:
    """Generate a structured, professional PDF report from analysis results."""
    if not FPDF_AVAILABLE:
        raise RuntimeError("fpdf2 is not installed. Install it with: pip install fpdf2")

    pdf = PDFReport(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.alias_nb_pages()
    pdf.add_page()

    # 1. Title and Header Card
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(
        0,
        10,
        safe_text(f"Analysis Report: {analysis.job_title or 'Target Position'}"),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 116, 139)
    candidate_name = analysis.cv_profile.name if analysis.cv_profile and analysis.cv_profile.name else "Candidate"
    date_str = analysis.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
    demo_tag = " (DEMO MODE)" if analysis.is_demo_mode else ""
    pdf.cell(
        0,
        6,
        safe_text(f"Candidate: {candidate_name} | Date: {date_str} | Provider: {analysis.provider.upper()}{demo_tag}"),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.ln(4)

    # 2. Executive Score Summary
    box_x = pdf.l_margin
    box_y = pdf.get_y()
    box_w = pdf.epw
    pdf.set_fill_color(241, 245, 249)
    pdf.rect(box_x, box_y, box_w, 24, "F")
    pdf.set_xy(box_x + 4, box_y + 2)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(55, 8, safe_text(f"Overall Score: {analysis.scores.overall_score}%"), new_x=XPos.RIGHT, new_y=YPos.TOP)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(51, 65, 85)
    pdf.cell(50, 8, safe_text(f"Total Requirements: {analysis.scores.total_requirements}"), new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(0, 8, safe_text(f"Matched: {analysis.scores.matched} | Partial: {analysis.scores.partial} | Missing: {analysis.scores.not_evidenced}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(box_x + 4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(
        0,
        6,
        safe_text(f"Priority Breakdown -> Required: {analysis.scores.required_score}% | Preferred: {analysis.scores.preferred_score}% | Nice-to-have: {analysis.scores.nice_to_have_score}%"),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.set_xy(pdf.l_margin, box_y + 28)

    # 3. Methodology Explanation
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Scoring Methodology & Verification", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, safe_text(analysis.scoring_explanation), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # 4. Strengths and Critical Gaps
    if analysis.strengths:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(22, 101, 52)  # Dark green
        pdf.cell(0, 7, "Key Candidate Strengths", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 41, 59)
        for s in analysis.strengths:
            pdf.multi_cell(0, 5, safe_text(f"- {s}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)

    if analysis.gaps or analysis.scores.critical_gaps:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(153, 27, 27)  # Dark red
        pdf.cell(0, 7, "Identified Gaps & Critical Missing Requirements", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 41, 59)
        all_gaps = list(dict.fromkeys(analysis.scores.critical_gaps + analysis.gaps))
        for g in all_gaps:
            pdf.multi_cell(0, 5, safe_text(f"- {g}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)

    # 5. Requirement Matches Detail
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Detailed Requirement Breakdown", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for m in analysis.requirement_matches:
        pdf.set_font("Helvetica", "B", 9)
        p_val = m.priority.value if hasattr(m.priority, "value") else str(m.priority)
        s_val = m.status.value if hasattr(m.status, "value") else str(m.status)
        quote_verified = " [Verified Quote]" if m.is_verified_quote else ""

        status_color = (22, 101, 52) if s_val == "match" else (
            (161, 98, 7) if s_val == "partial_match" else (153, 27, 27)
        )
        pdf.set_text_color(*status_color)
        pdf.cell(
            0,
            6,
            safe_text(f"[{m.requirement_id}] {m.requirement} ({p_val.upper()} - {s_val.upper()}{quote_verified})"),
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )

        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(71, 85, 105)
        pdf.multi_cell(0, 4.5, safe_text(f"Evaluation: {m.reason}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if m.evidence:
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(100, 116, 139)
            pdf.multi_cell(0, 4, safe_text(f'Evidence from CV: "{m.evidence}"'), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

    # 6. Actionable Revision Suggestions
    if analysis.suggestions:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, "Actionable CV Revision Suggestions", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        for sug in analysis.suggestions:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(30, 58, 138)
            pdf.cell(
                0,
                6,
                safe_text(f"[{sug.id}] Section: {sug.section} (Priority: {sug.priority})"),
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT,
            )

            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(51, 65, 85)
            pdf.multi_cell(0, 4.5, safe_text(f"Proposed: {sug.proposed_text}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(100, 116, 139)
            pdf.multi_cell(0, 4, safe_text(f"Rationale: {sug.reason}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)

    # 7. CV Quality Review
    if analysis.quality_review:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, "CV Quality Review", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(51, 65, 85)

        for dim_name, dim in [
            ("Clarity", analysis.quality_review.clarity),
            ("Relevance", analysis.quality_review.relevance),
            ("Impact Evidence", analysis.quality_review.impact_evidence),
            ("Structure", analysis.quality_review.structure),
        ]:
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 7, safe_text(f"{dim_name}: {dim.score}/5.0"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, safe_text(f"  {dim.reason}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            if dim.examples:
                pdf.set_font("Helvetica", "I", 8)
                for ex in dim.examples[:3]:
                    pdf.multi_cell(0, 4, safe_text(f"    * {ex}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)

    # 8. Disclaimer
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(148, 163, 184)
    pdf.multi_cell(
        0,
        3.5,
        safe_text(
            "DISCLAIMER: This score is a heuristic measure of how well your CV content "
            "matches the specific job description provided. It is NOT a hiring probability, "
            "a universal ATS compatibility score, or a guarantee of interview success. "
            "Use it as a guide to improve your CV content for specific applications."
        ),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    # Return raw PDF bytes
    output_result = pdf.output()
    if isinstance(output_result, (bytes, bytearray)):
        return bytes(output_result)
    return output_result.encode("latin-1")
