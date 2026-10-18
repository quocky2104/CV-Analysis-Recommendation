# CVision AI - Kiến trúc & Quyết định thiết kế

## Tổng quan

CVision AI là nền tảng phân tích CV và đối sánh công việc sử dụng AI. Ứng dụng giúp người tìm việc đánh giá mức độ phù hợp giữa CV và mô tả công việc (JD), đồng thời đề xuất cải thiện CV dựa trên bằng chứng thực tế.

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │Landing│ │Analyze│ │Result│ │History │ │
│  │ Page  │ │ Page  │ │ Page │ │  Page  │ │
│  └──────┘ └──────┘ └──────┘ └────────┘ │
│          TypeScript + Tailwind           │
└─────────────────┬───────────────────────┘
                  │ REST API (JSON)
                  │ Multipart uploads
┌─────────────────┴───────────────────────┐
│           Backend (FastAPI)              │
│  ┌─────────────────────────────────────┐ │
│  │         API Layer (routes.py)       │ │
│  └──────────────┬──────────────────────┘ │
│  ┌──────────────┴──────────────────────┐ │
│  │    Analysis Service (orchestrator)  │ │
│  └──┬────┬────┬────┬────┬────┬────┬───┘ │
│     │    │    │    │    │    │    │      │
│  ┌──┴┐┌──┴┐┌──┴┐┌──┴┐┌──┴┐┌──┴┐┌──┴┐   │
│  │FP ││CVP││JDP││MAT││LLM││RPT││CVE│   │
│  └───┘└───┘└───┘└───┘└───┘└───┘└───┘   │
│                                         │
│  FP  = File Parser (PyMuPDF, docx)      │
│  CVP = CV Parser                        │
│  JDP = JD Parser                        │
│  MAT = Matcher + Scoring Engine         │
│  LLM = AI Provider (OpenAI / Mock)      │
│  RPT = Report Export (PDF)              │
│  CVE = CV Export (DOCX)                 │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │   Database (SQLite / PostgreSQL)    │ │
│  │   via SQLAlchemy 2.x               │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Luồng xử lý phân tích

```
Upload CV + JD
       │
       ▼
┌─────────────────┐
│ Validate Files  │──▶ Reject if invalid
│ (size, type,    │
│  magic bytes)   │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Extract Text    │──▶ Warn if scanned/empty
│ (PyMuPDF/docx)  │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Parse CV & JD   │  AI Provider hoặc Mock
│ (structured)    │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Match & Score   │  AI matching + deterministic scoring
│ Requirements    │  (Python tính điểm, KHÔNG dùng điểm LLM)
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Verify Evidence │  So sánh quotes với CV text
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Gen Suggestions │  Đề xuất cải thiện dựa trên gaps
│ + Quality Review│
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Return Results  │  Optionally save to history
└─────────────────┘
```

## Quyết định thiết kế chính

### 1. Tính điểm minh bạch (Transparent Scoring)
- Điểm được tính **deterministic** trong Python, không phụ thuộc vào LLM
- Công thức: `score = 100 × Σ(priority_weight × evidence_score) / Σ(priority_weight)`
- Trọng số: required=3, preferred=2, nice_to_have=1
- Điểm bằng chứng: match=1.0, partial_match=0.5, not_evidenced=0.0
- Điểm này là **heuristic** để đánh giá nội dung CV, KHÔNG phải xác suất tuyển dụng

### 2. AI Provider Interface
- Abstract interface cho phép swap giữa OpenAI và Mock
- Mock mode: phân tích dựa trên rule, gắn nhãn rõ ràng "Demo mode"
- OpenAI mode: sử dụng Structured Outputs để đảm bảo output format
- Không fallback silent từ OpenAI sang Mock khi thiếu key

### 3. Bảo mật & Quyền riêng tư
- File upload: validate extension, MIME, magic bytes, size
- Temp files: random names, cleanup trong finally blocks
- Không lưu file upload gốc
- Không log CV text đầy đủ hoặc API key
- CORS cấu hình explicit
- History: opt-in, chỉ lưu structured data

### 4. Đa ngôn ngữ
- UI chính: Tiếng Việt
- Hỗ trợ chọn ngôn ngữ output cho nội dung phân tích
- CV/JD có thể bằng bất kỳ ngôn ngữ nào

### 5. Database
- SQLite mặc định, cấu hình qua DATABASE_URL
- Có thể chuyển sang PostgreSQL không cần thay đổi code
- Chỉ lưu metadata + JSON result khi user opt-in

## API Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | /api/v1/health | Health check + provider info |
| POST | /api/v1/analyze | Phân tích CV vs JD |
| GET | /api/v1/history | Danh sách phân tích đã lưu |
| GET | /api/v1/history/{id} | Chi tiết phân tích |
| DELETE | /api/v1/history/{id} | Xóa phân tích |
| POST | /api/v1/exports/report.pdf | Xuất báo cáo PDF |
| POST | /api/v1/exports/cv.docx | Xuất CV draft DOCX |

## Giới hạn (MVP)

1. Single-user mode - không có authentication
2. Không OCR cho PDF scan
3. Không retain formatting gốc của CV khi export DOCX
4. File size tối đa 10MB
5. Không real-time streaming cho analysis progress
6. SQLite cho development - cần PostgreSQL cho production scale
