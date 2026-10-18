from enum import Enum
from typing import Dict


class MatchStatus(str, Enum):
    MATCH = "match"
    PARTIAL_MATCH = "partial_match"
    NOT_EVIDENCED = "not_evidenced"


class Priority(str, Enum):
    REQUIRED = "required"
    PREFERRED = "preferred"
    NICE_TO_HAVE = "nice_to_have"


PRIORITY_WEIGHTS: Dict[str, int] = {
    Priority.REQUIRED.value: 3,
    Priority.PREFERRED.value: 2,
    Priority.NICE_TO_HAVE.value: 1,
}

EVIDENCE_SCORES: Dict[str, float] = {
    MatchStatus.MATCH.value: 1.0,
    MatchStatus.PARTIAL_MATCH.value: 0.5,
    MatchStatus.NOT_EVIDENCED.value: 0.0,
}
