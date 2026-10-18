import uuid
from datetime import datetime, timezone
from typing import List, Optional
try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = object  # type: ignore

from app.config import Settings
from app.schemas.analysis import AnalysisResponse, RequirementMatch
from app.schemas.common import MatchStatus, Priority
from app.services.file_parser import extract_text, validate_file
from app.services.history_service import save_analysis
from app.services.llm_service import AIProvider
from app.services.matcher import calculate_scores, verify_evidence


class AnalysisService:
    def __init__(self, ai_provider: AIProvider, settings: Settings) -> None:
        self.ai_provider = ai_provider
        self.settings = settings

    async def analyze(
        self,
        cv_filename: str,
        cv_bytes: bytes,
        cv_content_type: Optional[str] = None,
        jd_text: Optional[str] = None,
        jd_filename: Optional[str] = None,
        jd_bytes: Optional[bytes] = None,
        jd_content_type: Optional[str] = None,
        output_language: str = "vi",
        save_to_history: bool = False,
        db: Optional[Session] = None,
    ) -> AnalysisResponse:
        """
        Execute full end-to-end CV and JD analysis pipeline.
        Deterministic scoring is enforced; LLM raw scores are never trusted.
        """
        warnings: List[str] = []

        # 1. Validate CV file
        cv_val = validate_file(
            filename=cv_filename,
            content_type=cv_content_type,
            file_bytes=cv_bytes,
            max_size_bytes=self.settings.max_file_size_bytes,
        )
        if not cv_val.is_valid:
            raise ValueError(f"CV Validation Error: {cv_val.error_message}")

        # 2. Extract CV text
        extracted_cv = extract_text(
            filename=cv_filename,
            file_bytes=cv_bytes,
            max_chars=self.settings.max_extracted_text_chars,
        )
        warnings.extend(extracted_cv.warnings)
        cv_text = extracted_cv.text

        if len(cv_text.strip()) < 20:
            raise ValueError("CV contains insufficient readable text. Scanned or empty documents cannot be processed.")

        # 3. Resolve and extract JD text
        final_jd_text = ""
        if jd_text and jd_text.strip():
            # If both are supplied, prioritize jd_text
            final_jd_text = jd_text.strip()
        elif jd_bytes and len(jd_bytes) > 0:
            jd_fn = jd_filename or "job_description.txt"
            jd_val = validate_file(
                filename=jd_fn,
                content_type=jd_content_type,
                file_bytes=jd_bytes,
                max_size_bytes=self.settings.max_file_size_bytes,
            )
            if not jd_val.is_valid:
                raise ValueError(f"Job Description Validation Error: {jd_val.error_message}")

            extracted_jd = extract_text(
                filename=jd_fn,
                file_bytes=jd_bytes,
                max_chars=self.settings.max_extracted_text_chars,
            )
            warnings.extend(extracted_jd.warnings)
            final_jd_text = extracted_jd.text.strip()
        else:
            raise ValueError("No Job Description provided. Please provide either jd_text or a jd_file.")

        if len(final_jd_text) < 20:
            raise ValueError("Job Description contains insufficient readable text.")

        # 4. Parse CV Profile
        cv_profile = await self.ai_provider.parse_cv(cv_text, language=output_language)

        # 5. Parse JD Analysis
        jd_analysis = await self.ai_provider.parse_jd(final_jd_text, language=output_language)

        if not jd_analysis.requirements:
            warnings.append("No distinct bullet requirements could be extracted from the Job Description.")

        # 6. Requirement Matching
        raw_matches = await self.ai_provider.match_requirements(
            cv=cv_profile,
            jd=jd_analysis,
            cv_text=cv_text,
            language=output_language,
        )

        # 7. Quote Verification: Verify evidence quotes directly against source CV text
        verified_matches: List[RequirementMatch] = []
        for match in raw_matches:
            is_verified = False
            if match.evidence:
                is_verified = verify_evidence(match.evidence, cv_text)

            verified_matches.append(
                RequirementMatch(
                    requirement_id=match.requirement_id,
                    requirement=match.requirement,
                    priority=match.priority,
                    category=match.category,
                    status=match.status,
                    reason=match.reason,
                    evidence=match.evidence,
                    evidence_section=match.evidence_section,
                    is_verified_quote=is_verified,
                )
            )

        # 8. Deterministic Scoring (Never trust LLM scores)
        scores = calculate_scores(verified_matches)

        # 9. Revision Suggestions
        suggestions = await self.ai_provider.generate_suggestions(
            cv=cv_profile,
            jd=jd_analysis,
            matches=verified_matches,
            language=output_language,
        )

        # 10. CV Quality Review
        quality_review = await self.ai_provider.review_cv_quality(
            cv=cv_profile,
            jd=jd_analysis,
            language=output_language,
        )

        # 11. Keyword Analysis
        keyword_analysis = await self.ai_provider.analyze_keywords(
            cv=cv_profile,
            jd=jd_analysis,
            cv_text=cv_text,
            language=output_language,
        )

        # 12. Synthesize candidate strengths and gaps
        is_vi = output_language == "vi"
        strengths: List[str] = []
        for m in verified_matches:
            if m.status == MatchStatus.MATCH:
                strengths.append(f"{m.requirement} ({m.category})")
            if len(strengths) >= 5:
                break

        if not strengths and cv_profile.skills:
            strengths = [f"Kỹ năng: {s}" if is_vi else f"Proficiency: {s}" for s in cv_profile.skills[:5]]

        gaps: List[str] = list(scores.critical_gaps)
        for m in verified_matches:
            if m.status != MatchStatus.MATCH and m.requirement not in gaps:
                gaps.append(m.requirement)
            if len(gaps) >= 6:
                break

        # 13. Scoring Explanation
        if is_vi:
            scoring_explanation = (
                "Điểm số được tính toán hoàn toàn tất định bằng trọng số ưu tiên: "
                "Yêu cầu bắt buộc (Required, trọng số 3), Ưu tiên (Preferred, trọng số 2), Điểm cộng (Nice to have, trọng số 1). "
                "Mức độ đáp ứng: Match (100%), Partial Match (50%), Not Evidenced (0%). "
                "Bằng chứng trích dẫn được đối chiếu tự động với văn bản gốc của CV."
            )
        else:
            scoring_explanation = (
                "Scores are computed deterministically using weighted priorities: "
                "Required (weight 3), Preferred (weight 2), Nice-to-have (weight 1). "
                "Match status points: Match (1.0), Partial Match (0.5), Not Evidenced (0.0). "
                "Cited evidence quotes are verified against the original CV text."
            )

        provider_name = getattr(self.ai_provider, "provider_name", "mock")
        is_demo = getattr(self.ai_provider, "is_demo_mode", True)

        response = AnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            job_title=jd_analysis.job_title,
            provider=provider_name,
            is_demo_mode=is_demo,
            scores=scores,
            requirement_matches=verified_matches,
            strengths=strengths,
            gaps=gaps,
            keyword_analysis=keyword_analysis,
            quality_review=quality_review,
            suggestions=suggestions,
            cv_profile=cv_profile,
            jd_analysis=jd_analysis,
            warnings=warnings,
            scoring_explanation=scoring_explanation,
        )

        # 14. Optionally persist to history
        if save_to_history and db is not None:
            save_analysis(db, response)

        return response
