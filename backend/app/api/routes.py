from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = object  # type: ignore

from app.api.dependencies import get_ai_provider_dep, get_analysis_service
from app.config import Settings, get_settings
from app.database import get_db
from app.schemas.analysis import AnalysisResponse, AnalysisSummary
from app.schemas.export import CVExportRequest, ReportExportRequest
from app.services.analysis_service import AnalysisService
from app.services.cv_export import generate_docx_cv
from app.services.history_service import delete_analysis, get_analysis, list_analyses
from app.services.llm_service import AIProvider
from app.services.report_export import generate_pdf_report

router = APIRouter(prefix="/api/v1", tags=["Analysis & Exports"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(
    settings: Settings = Depends(get_settings),
    ai_provider: AIProvider = Depends(get_ai_provider_dep),
) -> dict:
    """Return API health status, active provider, and demo mode indicator."""
    is_demo = getattr(ai_provider, "is_demo_mode", settings.ai_provider == "mock")
    provider_name = getattr(ai_provider, "provider_name", settings.ai_provider)
    return {
        "status": "ok",
        "provider": provider_name,
        "is_demo": is_demo,
        "environment": settings.app_env,
    }


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_cv_and_jd(
    cv_file: UploadFile = File(..., description="Candidate CV file (PDF, DOCX, or TXT)"),
    jd_text: Optional[str] = Form(None, description="Job Description plain text"),
    jd_file: Optional[UploadFile] = File(None, description="Job Description file (PDF, DOCX, or TXT)"),
    output_language: str = Form("vi", description="Analysis language: vi or en"),
    save_to_history: bool = Form(False, description="Whether to persist results in database"),
    analysis_service: AnalysisService = Depends(get_analysis_service),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """
    Analyze candidate CV against a Job Description.
    Performs deterministic scoring, verifiable quote extraction, and revision suggestions.
    """
    # 1. Validate JD input presence
    has_jd_text = bool(jd_text and jd_text.strip())
    has_jd_file = jd_file is not None and bool(jd_file.filename)

    if not has_jd_text and not has_jd_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required. Provide either 'jd_text' or 'jd_file'.",
        )

    # 2. Read and validate CV file
    cv_filename = cv_file.filename or "cv_document"
    cv_bytes = await cv_file.read()

    if len(cv_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CV file is empty.",
        )

    if len(cv_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"CV file size exceeds maximum limit of {settings.max_file_size_mb}MB.",
        )

    # 3. Read and validate JD file if provided
    jd_bytes = None
    jd_filename = None
    jd_content_type = None

    if has_jd_file and jd_file is not None:
        jd_filename = jd_file.filename
        jd_content_type = jd_file.content_type
        jd_bytes = await jd_file.read()

        if len(jd_bytes) > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"JD file size exceeds maximum limit of {settings.max_file_size_mb}MB.",
            )

    try:
        result = await analysis_service.analyze(
            cv_filename=cv_filename,
            cv_bytes=cv_bytes,
            cv_content_type=cv_file.content_type,
            jd_text=jd_text,
            jd_filename=jd_filename,
            jd_bytes=jd_bytes,
            jd_content_type=jd_content_type,
            output_language=output_language,
            save_to_history=save_to_history,
            db=db,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(exc)}")


@router.get("/history", response_model=List[AnalysisSummary], status_code=status.HTTP_200_OK)
def get_history_list(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> List[AnalysisSummary]:
    """Retrieve summaries of previous analyses saved in history."""
    return list_analyses(db, skip=skip, limit=limit)


@router.get("/history/{analysis_id}", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
def get_history_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Retrieve full details of a saved analysis by ID."""
    record = get_analysis(db, analysis_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID '{analysis_id}' not found.",
        )
    return record


@router.delete("/history/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_history_item(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a saved analysis from history."""
    deleted = delete_analysis(db, analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID '{analysis_id}' not found.",
        )
    return {"message": "Analysis deleted successfully", "id": analysis_id}


@router.post("/exports/report.pdf", status_code=status.HTTP_200_OK)
def export_pdf_report(request: ReportExportRequest) -> Response:
    """Generate and download a comprehensive PDF report from analysis results."""
    try:
        pdf_bytes = generate_pdf_report(request.analysis_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="cvision_match_report.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(exc)}",
        )


@router.post("/exports/cv.docx", status_code=status.HTTP_200_OK)
def export_docx_cv(request: CVExportRequest) -> Response:
    """Generate and download a tailored DOCX CV incorporating approved suggestions."""
    try:
        docx_bytes = generate_docx_cv(
            cv_profile=request.cv_profile,
            approved_suggestion_ids=request.approved_suggestion_ids,
            suggestions=request.suggestions,
        )
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="cvision_tailored_cv.docx"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate DOCX CV: {str(exc)}",
        )
