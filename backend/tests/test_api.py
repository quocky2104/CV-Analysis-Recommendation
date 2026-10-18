import pytest
try:
    from fastapi.testclient import TestClient
except (ImportError, RuntimeError):
    TestClient = None

from app.schemas.analysis import AnalysisResponse


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "provider" in data
    assert "is_demo" in data


def test_analyze_with_mock_provider(
    client: TestClient,
    sample_cv_text: str,
    sample_jd_text: str,
) -> None:
    response = client.post(
        "/api/v1/analyze",
        files={"cv_file": ("resume.txt", sample_cv_text.encode("utf-8"), "text/plain")},
        data={
            "jd_text": sample_jd_text,
            "output_language": "vi",
            "save_to_history": "true",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert data["provider"] == "mock"
    assert data["is_demo_mode"] is True
    assert "scores" in data
    assert "overall_score" in data["scores"]
    assert len(data["requirement_matches"]) > 0
    assert len(data["suggestions"]) > 0


def test_analyze_missing_cv(client: TestClient, sample_jd_text: str) -> None:
    # No CV file uploaded
    response = client.post(
        "/api/v1/analyze",
        data={"jd_text": sample_jd_text},
    )
    assert response.status_code in (400, 422)


def test_analyze_missing_jd(client: TestClient, sample_cv_text: str) -> None:
    # No JD provided at all
    response = client.post(
        "/api/v1/analyze",
        files={"cv_file": ("resume.txt", sample_cv_text.encode("utf-8"), "text/plain")},
        data={"output_language": "en"},
    )
    assert response.status_code == 400
    assert "job description is required" in response.json()["detail"].lower()


def test_analyze_with_both_jd_text_and_file(
    client: TestClient,
    sample_cv_text: str,
    sample_jd_text: str,
) -> None:
    # Providing both should work cleanly by prioritizing jd_text
    response = client.post(
        "/api/v1/analyze",
        files={
            "cv_file": ("resume.txt", sample_cv_text.encode("utf-8"), "text/plain"),
            "jd_file": ("jd.txt", sample_jd_text.encode("utf-8"), "text/plain"),
        },
        data={
            "jd_text": sample_jd_text,
            "output_language": "vi",
            "save_to_history": "false",
        },
    )
    assert response.status_code == 200
    assert response.json()["scores"]["overall_score"] >= 0


def test_history_crud_api(
    client: TestClient,
    sample_cv_text: str,
    sample_jd_text: str,
) -> None:
    # 1. Analyze and save to history
    create_res = client.post(
        "/api/v1/analyze",
        files={"cv_file": ("resume.txt", sample_cv_text.encode("utf-8"), "text/plain")},
        data={
            "jd_text": sample_jd_text,
            "output_language": "en",
            "save_to_history": "true",
        },
    )
    assert create_res.status_code == 200
    analysis_id = create_res.json()["analysis_id"]

    # 2. List history
    list_res = client.get("/api/v1/history")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert any(item["id"] == analysis_id for item in items)

    # 3. Get single history item
    get_res = client.get(f"/api/v1/history/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["analysis_id"] == analysis_id

    # 4. Delete history item
    del_res = client.delete(f"/api/v1/history/{analysis_id}")
    assert del_res.status_code == 200

    # 5. Confirm deletion returns 404
    get_again = client.get(f"/api/v1/history/{analysis_id}")
    assert get_again.status_code == 404


def test_export_pdf_report(
    client: TestClient,
    sample_analysis_response: AnalysisResponse,
) -> None:
    payload = {"analysis_data": sample_analysis_response.model_dump(mode="json")}
    res = client.post("/api/v1/exports/report.pdf", json=payload)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF-")


def test_export_docx_cv(
    client: TestClient,
    sample_analysis_response: AnalysisResponse,
) -> None:
    payload = {
        "cv_profile": sample_analysis_response.cv_profile.model_dump(mode="json"),
        "approved_suggestion_ids": ["SUG-001"],
        "suggestions": [s.model_dump(mode="json") for s in sample_analysis_response.suggestions],
    }
    res = client.post("/api/v1/exports/cv.docx", json=payload)
    assert res.status_code == 200
    assert "wordprocessingml" in res.headers["content-type"]
    assert res.content.startswith(b"PK\x03\x04")


@pytest.mark.anyio
async def test_analysis_service_pipeline_mock(
    sample_cv_text: str,
    sample_jd_text: str,
) -> None:
    from app.config import get_settings
    from app.services.analysis_service import AnalysisService
    from app.services.llm_service import MockAIProvider

    service = AnalysisService(ai_provider=MockAIProvider(), settings=get_settings())
    res = await service.analyze(
        cv_filename="resume.txt",
        cv_bytes=sample_cv_text.encode("utf-8"),
        jd_text=sample_jd_text,
        output_language="vi",
        save_to_history=False,
    )
    assert res.analysis_id
    assert res.provider == "mock"
    assert res.is_demo_mode is True
    assert res.scores.overall_score >= 0
    assert len(res.requirement_matches) > 0
    assert len(res.suggestions) > 0


@pytest.mark.anyio
async def test_analysis_service_missing_jd_fails(sample_cv_text: str) -> None:
    import pytest
    from app.config import get_settings
    from app.services.analysis_service import AnalysisService
    from app.services.llm_service import MockAIProvider

    service = AnalysisService(ai_provider=MockAIProvider(), settings=get_settings())
    with pytest.raises(ValueError, match="No Job Description provided"):
        await service.analyze(
            cv_filename="resume.txt",
            cv_bytes=sample_cv_text.encode("utf-8"),
            jd_text="",
        )


@pytest.mark.anyio
async def test_analysis_service_empty_cv_fails(sample_jd_text: str) -> None:
    import pytest
    from app.config import get_settings
    from app.services.analysis_service import AnalysisService
    from app.services.llm_service import MockAIProvider

    service = AnalysisService(ai_provider=MockAIProvider(), settings=get_settings())
    with pytest.raises(ValueError, match="CV Validation Error"):
        await service.analyze(
            cv_filename="empty.txt",
            cv_bytes=b"",
            jd_text=sample_jd_text,
        )


@pytest.mark.anyio
async def test_analysis_service_with_both_jd_inputs(
    sample_cv_text: str,
    sample_jd_text: str,
) -> None:
    from app.config import get_settings
    from app.services.analysis_service import AnalysisService
    from app.services.llm_service import MockAIProvider

    service = AnalysisService(ai_provider=MockAIProvider(), settings=get_settings())
    res = await service.analyze(
        cv_filename="resume.txt",
        cv_bytes=sample_cv_text.encode("utf-8"),
        jd_text=sample_jd_text,
        jd_filename="jd.txt",
        jd_bytes=sample_jd_text.encode("utf-8"),
    )
    assert res.scores.overall_score >= 0
