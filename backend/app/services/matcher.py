import re
from typing import List, Optional

from app.schemas.analysis import RequirementMatch, ScoreBreakdown
from app.schemas.common import EVIDENCE_SCORES, PRIORITY_WEIGHTS, MatchStatus, Priority


def normalize_text(text: Optional[str]) -> str:
    """Normalize text by lowering case and collapsing whitespace."""
    if not text:
        return ""
    # Strip quotes or punctuation around edges
    cleaned = text.strip(" '\"`“”‘’\t\r\n")
    # Collapse multiple whitespaces and linebreaks into single spaces
    return re.sub(r"\s+", " ", cleaned).lower()


def verify_evidence(evidence: Optional[str], cv_text: Optional[str]) -> bool:
    """
    Verify whether an evidence quote actually appears in the CV text.
    Handles whitespace normalization and case-insensitivity.
    """
    if not evidence or not cv_text:
        return False

    norm_evidence = normalize_text(evidence)
    norm_cv = normalize_text(cv_text)

    if not norm_evidence or not norm_cv:
        return False

    # Check exact normalized match
    if norm_evidence in norm_cv:
        return True

    # If long quote, check if at least a significant contiguous segment (e.g. 80%) is found
    words = norm_evidence.split()
    if len(words) >= 5:
        segment_len = max(4, int(len(words) * 0.8))
        segment = " ".join(words[:segment_len])
        if segment in norm_cv:
            return True

    return False


def calculate_scores(matches: List[RequirementMatch]) -> ScoreBreakdown:
    """
    Deterministically calculate overall and category scores based on requirement matches.
    Never trust or use raw LLM scores for final scoring.
    """
    if not matches:
        return ScoreBreakdown(
            overall_score=0,
            total_requirements=0,
            matched=0,
            partial=0,
            not_evidenced=0,
            required_score=0,
            preferred_score=0,
            nice_to_have_score=0,
            critical_gaps=[],
        )

    matched_count = 0
    partial_count = 0
    not_evidenced_count = 0

    weighted_sum = 0.0
    max_weighted = 0.0

    for m in matches:
        # Resolve priority string/enum
        p_val = m.priority.value if isinstance(m.priority, Priority) else str(m.priority)
        s_val = m.status.value if isinstance(m.status, MatchStatus) else str(m.status)

        weight = PRIORITY_WEIGHTS.get(p_val, 1)
        evidence_score = EVIDENCE_SCORES.get(s_val, 0.0)

        weighted_sum += weight * evidence_score
        max_weighted += weight

        if s_val == MatchStatus.MATCH.value:
            matched_count += 1
        elif s_val == MatchStatus.PARTIAL_MATCH.value:
            partial_count += 1
        elif s_val == MatchStatus.NOT_EVIDENCED.value:
            not_evidenced_count += 1

    overall_score = round(100.0 * weighted_sum / max_weighted) if max_weighted > 0 else 0

    def calculate_priority_score(target_priority: Priority) -> int:
        target_matches = [
            m for m in matches
            if (m.priority.value if isinstance(m.priority, Priority) else str(m.priority)) == target_priority.value
        ]
        if not target_matches:
            return 0
        total_p_score = sum(
            EVIDENCE_SCORES.get(m.status.value if isinstance(m.status, MatchStatus) else str(m.status), 0.0)
            for m in target_matches
        )
        return round(100.0 * total_p_score / len(target_matches))

    required_score = calculate_priority_score(Priority.REQUIRED)
    preferred_score = calculate_priority_score(Priority.PREFERRED)
    nice_to_have_score = calculate_priority_score(Priority.NICE_TO_HAVE)

    critical_gaps = [
        m.requirement for m in matches
        if (m.priority.value if isinstance(m.priority, Priority) else str(m.priority)) == Priority.REQUIRED.value
        and (m.status.value if isinstance(m.status, MatchStatus) else str(m.status)) == MatchStatus.NOT_EVIDENCED.value
    ]

    return ScoreBreakdown(
        overall_score=overall_score,
        total_requirements=len(matches),
        matched=matched_count,
        partial=partial_count,
        not_evidenced=not_evidenced_count,
        required_score=required_score,
        preferred_score=preferred_score,
        nice_to_have_score=nice_to_have_score,
        critical_gaps=critical_gaps,
    )
