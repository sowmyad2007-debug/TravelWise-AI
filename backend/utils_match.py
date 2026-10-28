"""
Match score normalization utilities for TravelWise AI+ 2.0.
Decides and enforces the 0..100 integer contract across frontend and backend.
"""
from typing import Optional, Any

def normalize_match_score_py(score: Any) -> Optional[int]:
    """
    Normalizes a match score to an integer between 0 and 100.
    - None / empty string / NaN -> None (no misleading score)
    - 0 < score <= 1 (decimal fraction) -> score * 100
    - score >= 1 -> clamped to 0..100
    """
    if score is None or score == "":
        return None
    try:
        num = float(score)
    except (ValueError, TypeError):
        return None

    if num == 0:
        return 0
    if 0 < num <= 1:
        return int(round(num * 100))
    return int(min(100, max(0, round(num))))
