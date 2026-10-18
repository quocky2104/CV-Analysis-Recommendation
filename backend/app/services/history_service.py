from typing import List, Optional
try:
    from sqlalchemy import desc, select
    from sqlalchemy.orm import Session
except ImportError:
    Session = object  # type: ignore
    desc = select = None  # type: ignore

from app.models.analysis import SavedAnalysis
from app.schemas.analysis import AnalysisResponse, AnalysisSummary


def save_analysis(db: Session, analysis: AnalysisResponse) -> SavedAnalysis:
    """Persist an analysis response into the database."""
    # Check if analysis already exists
    existing = db.get(SavedAnalysis, analysis.analysis_id)
    if existing:
        db.delete(existing)
        db.flush()

    record = SavedAnalysis.from_response(analysis)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_analyses(db: Session, skip: int = 0, limit: int = 50) -> List[AnalysisSummary]:
    """Retrieve summaries of saved analyses sorted by latest first."""
    if hasattr(db, "store"):
        records = sorted(db.store.values(), key=lambda r: r.created_at, reverse=True)
        return [rec.to_summary() for rec in records[skip : skip + limit]]

    stmt = (
        select(SavedAnalysis)
        .order_by(desc(SavedAnalysis.created_at))
        .offset(skip)
        .limit(limit)
    )
    records = db.scalars(stmt).all()
    return [rec.to_summary() for rec in records]


def get_analysis(db: Session, analysis_id: str) -> Optional[AnalysisResponse]:
    """Retrieve full analysis response by unique ID."""
    record = db.get(SavedAnalysis, analysis_id)
    if not record:
        return None
    return record.to_response()


def delete_analysis(db: Session, analysis_id: str) -> bool:
    """Delete an analysis record from database by ID."""
    record = db.get(SavedAnalysis, analysis_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
