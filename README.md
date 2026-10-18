# CVision AI — Nền Tảng Phân Tích & Đối Chiếu Hồ Sơ Ứng Viên Với Mô Tả Công Việc

> **Tuyên bố miễn trừ trách nhiệm (Disclaimer):**
> Điểm số đối chiếu (`match_score`) trong hệ thống là một **chỉ số suy đoán định lượng (heuristic)** nhằm đánh giá mức độ bằng chứng thể hiện trong văn bản CV so với các yêu cầu cụ thể trong Mô tả công việc (Job Description - JD). Điểm số này **KHÔNG** đại diện cho xác suất được tuyển dụng, bảo đảm cơ hội phỏng vấn hay điểm số ATS phổ quát của bất kỳ phần mềm bên thứ ba nào.

---

## 1. Giới thiệu tổng quan

**CVision AI** là giải pháp hỗ trợ sự nghiệp và tối ưu hóa văn phong dành cho người tìm việc. Ứng dụng tiếp nhận hồ sơ ứng viên (định dạng PDF hoặc DOCX) và bản mô tả công việc (dán văn bản hoặc tải tệp), sau đó thực hiện:
- Bóc tách cấu trúc kinh nghiệm, kỹ năng, dự án và học vấn.
- Phân loại yêu cầu JD theo thứ tự ưu tiên: **Bắt buộc (Must-have - x3)**, **Ưu tiên (Preferred - x2)**, và **Điểm cộng (Nice-to-have - x1)**.
- Đối chiếu đa chiều từng yêu cầu với thông tin trong CV theo 3 cấp độ: `match` (đủ bằng chứng), `partial_match` (bằng chứng một phần/thiếu số liệu), và `not_evidenced` (chưa thể hiện trong CV).
- Trích xuất câu chữ thực tế (Verified Quotes) từ hồ sơ làm bằng chứng minh bạch, phân biệt rõ giữa bằng chứng nguyên văn và suy luận giải thích.
- Đề xuất câu chữ tối ưu theo từng mục CV, hỗ trợ người dùng **xem xét, tùy chỉnh và phê duyệt** trước khi xuất bản thảo CV định dạng Microsoft Word (.docx) hoặc Báo cáo phân tích chuyên nghiệp (.pdf).

---

## 2. Giao diện người dùng (Screenshots)

*Dưới đây là các vị trí hiển thị giao diện chính của hệ thống:*

- **Trang chủ (Landing Page):** Giới thiệu quy trình 3 bước, bảng tính năng chuyên sâu và cam kết bảo mật quyền riêng tư.  
  `[Ảnh chụp màn hình: Giao diện Trang chủ CVision AI - Độ tương phản cao, chuẩn SaaS Light Theme]`

- **Trang phân tích (Analyze Page):** Khu vực kéo thả CV và ô nhập liệu JD, lựa chọn ngôn ngữ báo cáo, cùng tùy chọn lưu trữ an toàn và nạp nhanh dữ liệu mẫu 1-click.  
  `[Ảnh chụp màn hình: Giao diện Trang phân tích tải lên hồ sơ và nhập bản mô tả công việc]`

- **Trang kết quả phân tích (Results Page):** Biểu đồ điểm số tổng thể, bảng phân rã điểm theo độ ưu tiên, danh sách đối chiếu tiêu chí kèm trích dẫn nguyên văn từ CV, phân tích từ khóa ATS, đánh giá 4 khía cạnh chất lượng và bảng đề xuất chỉnh sửa tương tác.  
  `[Ảnh chụp màn hình: Bảng điều khiển kết quả phân tích đa chiều kèm bộ công cụ xuất PDF/DOCX]`

- **Trang lịch sử phân tích (History Page):** Quản lý các phiên phân tích đã lưu, hỗ trợ mở lại xem toàn bộ chi tiết hoặc xóa vĩnh viễn.  
  `[Ảnh chụp màn hình: Danh mục lịch sử phân tích đã lưu với tính năng xem chi tiết và xác nhận xóa an toàn]`

---

## 3. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (Next.js 16 + React 19)            │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ Landing Page │ │ Analyze Form │ │ Results & Edit Panel│  │
│  └──────────────┘ └──────────────┘ └─────────────────────┘  │
│          TypeScript + Tailwind CSS (Accessible Light Theme) │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / Multipart Uploads
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (FastAPI + Python 3.11+)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    API Router Layer                   │  │
│  │   /health | /analyze | /history | /exports (pdf/docx) │  │
│  └───────────┬───────────────────────────────┬───────────┘  │
│              │                               │              │
│  ┌───────────▼───────────┐       ┌───────────▼───────────┐  │
│  │ Secure File Parser    │       │ AI Provider Interface │  │
│  │ (PyMuPDF, docx, txt)  │       │ ├─ OpenAI (Structured)│  │
│  │ • Size & Magic bytes  │       │ └─ Mock (Demo Heuristic│ │
│  │ • Scanned PDF detect  │       └───────────┬───────────┘  │
│  └───────────┬───────────┘                   │              │
│              └───────────────┬───────────────┘              │
│                              ▼                              │
│              ┌───────────────────────────────┐              │
│              │ Deterministic Scoring Engine  │              │
│              │ • Required=3, Preferred=2...  │              │
│              │ • Evidence Quote Verification │              │
│              └───────────────┬───────────────┘              │
│                              ▼                              │
│              ┌───────────────────────────────┐              │
│              │ Document Exporters & Storage  │              │
│              │ • PDF Report (fpdf2)          │              │
│              │ • Tailored CV (python-docx)   │              │
│              │ • SQLite via SQLAlchemy 2.x   │              │
│              └───────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Cấu trúc thư mục dự án

```
CVision/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Khởi tạo FastAPI, CORS, Lifespan DB
│   │   ├── config.py            # Quản lý cài đặt môi trường (Pydantic BaseSettings)
│   │   ├── database.py          # SQLAlchemy engine, session maker, base model
│   │   ├── api/
│   │   │   ├── dependencies.py  # Dependency Injection (DB, Provider, AnalysisService)
│   │   │   └── routes.py        # Các REST endpoint
│   │   ├── schemas/             # Pydantic Schemas khớp 100% giữa API và LLM
│   │   │   ├── common.py        # Enums (MatchStatus, Priority) và trọng số điểm
│   │   │   ├── cv.py            # Mô hình CVProfile
│   │   │   ├── jd.py            # Mô hình JDAnalysis & JDRequirement
│   │   │   ├── analysis.py      # Mô hình phân tích, đánh giá, đề xuất
│   │   │   └── export.py        # Yêu cầu xuất tệp PDF/DOCX
│   │   ├── models/
│   │   │   └── analysis.py      # SQLAlchemy 2.0 SavedAnalysis model
│   │   └── services/
│   │       ├── file_parser.py   # Trích xuất PDF/DOCX, bảo mật chống path traversal
│   │       ├── cv_parser.py     # Trích xuất thông tin có cấu trúc từ hồ sơ
│   │       ├── jd_parser.py     # Trích xuất yêu cầu có cấu trúc từ JD
│   │       ├── matcher.py       # Thuật toán tính điểm tất định và xác minh trích dẫn
│   │       ├── llm_service.py   # AI Provider abstraction: OpenAI & Mock Provider
│   │       ├── report_export.py # Tạo báo cáo PDF (fpdf2)
│   │       ├── cv_export.py     # Tạo CV Word đã chỉnh sửa (python-docx)
│   │       ├── history_service.py # Thao tác CRUD lịch sử
│   │       └── analysis_service.py # Điều phối toàn bộ quy trình phân tích
│   ├── tests/                   # Bộ kiểm thử tự động pytest (43 tests)
│   │   ├── conftest.py          # Fixtures dữ liệu và TestClient
│   │   ├── test_api.py          # Kiểm thử tích hợp REST API và export
│   │   ├── test_file_parser.py  # Kiểm thử bảo mật tệp và trích xuất
│   │   ├── test_history.py      # Kiểm thử lưu trữ, tra cứu và xóa lịch sử
│   │   ├── test_schemas.py      # Kiểm thử ràng buộc Pydantic
│   │   └── test_scoring.py      # Kiểm thử công thức tính điểm và trọng số
│   └── requirements.txt         # Khai báo thư viện Python
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout chuẩn tiếng Việt & theme tương phản cao
│   │   │   ├── globals.css      # Thiết lập CSS Tokens & Tailwind CSS v4
│   │   │   ├── page.tsx         # Trang chủ giới thiệu nền tảng
│   │   │   ├── analyze/
│   │   │   │   └── page.tsx     # Trang tải lên tệp CV và nhập JD
│   │   │   ├── results/
│   │   │   │   └── page.tsx     # Bảng điều khiển kết quả phân tích và đề xuất
│   │   │   └── history/
│   │   │       └── page.tsx     # Quản lý danh sách lịch sử phân tích
│   │   ├── components/
│   │   │   ├── layout/          # Header, Footer
│   │   │   ├── results/         # ScoreDisplay, RequirementTable, SuggestionsPanel, ExportActions
│   │   │   └── ui/              # Button, Card, Badge, Progress
│   │   └── lib/
│   │       ├── api.ts           # HTTP Client fetch backend API
│   │       ├── constants.ts     # Hằng số giới hạn, định dạng tệp, trọng số
│   │       ├── i18n.ts          # Từ điển song ngữ Tiếng Việt / Tiếng Anh
│   │       ├── sample-data.ts   # Bộ dữ liệu mẫu Senior Fullstack Developer
│   │       ├── types.ts         # TypeScript interfaces đồng bộ với backend
│   │       └── utils.ts         # Tiện ích định dạng, tính màu sắc, tải tệp
│   ├── package.json
│   └── tsconfig.json
├── sample_data/                 # Dữ liệu thực tế kiểm thử (VI & EN)
│   ├── sample_cv.md
│   ├── sample_cv_en.md
│   ├── sample_jd.md
│   └── sample_jd_en.md
├── docs/
│   └── architecture.md          # Tài liệu chi tiết các quyết định kiến trúc
├── .env.example                 # Mẫu biến môi trường
└── README.md
```

---

## 5. Yêu cầu hệ thống (Prerequisites)

- **Python**: Phiên bản 3.11 hoặc mới hơn (đã kiểm thử và chạy ổn định trên Python 3.13).
- **Node.js**: Phiên bản 18.x, 20.x hoặc 22.x LTS.
- **Trình quản lý gói**: `npm` hoặc `pnpm`.

---

## 6. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Thiết lập cấu hình biến môi trường
Sao chép tệp cấu hình mẫu ở thư mục gốc thành `.env`:
```bash
# Trên Windows PowerShell hoặc Linux/macOS
cp .env.example .env
```

Các biến môi trường chính trong `.env`:
```ini
# Lựa chọn Provider: "mock" (chế độ demo không cần key) hoặc "openai" (dùng AI thật)
AI_PROVIDER=mock

# Chỉ bắt buộc khi AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Cơ sở dữ liệu SQLite mặc định (có thể đổi sang PostgreSQL)
DATABASE_URL=sqlite:///./cvision.db

# Giới hạn kích thước tệp upload và ký tự bóc tách
MAX_FILE_SIZE_MB=10
MAX_EXTRACTED_TEXT_CHARS=60000

# Địa chỉ Frontend cho phép kết nối qua CORS
FRONTEND_ORIGINS=http://localhost:3000

# Đường dẫn API Backend cho Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

### Bước 2: Cài đặt & Khởi chạy Backend (FastAPI)

#### Dành cho Windows (PowerShell):
```powershell
# 1. Điều hướng vào thư mục backend
cd d:\MyProject\backend

# 2. Tạo môi trường ảo Python (khuyến nghị)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Cài đặt các thư viện cần thiết
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 4. Khởi chạy máy chủ Backend tại cổng 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Dành cho macOS / Linux (Bash/Zsh):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> Kiểm tra Backend đang hoạt động: Truy cập [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) hoặc xem tài liệu Swagger UI tự động tại [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Bước 3: Cài đặt & Khởi chạy Frontend (Next.js)

Mở một cửa sổ dòng lệnh thứ hai:

#### Dành cho Windows (PowerShell):
```powershell
# 1. Điều hướng vào thư mục frontend
cd d:\MyProject\frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển tại cổng 3000
npm run dev
```

#### Dành cho macOS / Linux:
```bash
cd frontend
npm install
npm run dev
```

> Mở trình duyệt và truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 7. Sử dụng Chế độ Demo (Mock Mode) vs AI Thật (OpenAI)

### Chế độ Demo (Mặc định - Hoạt động ngay không cần API Key)
- Thiết lập `AI_PROVIDER=mock` trong `.env`.
- Hệ thống sử dụng bộ parser dựa trên luật suy diễn và regex thông minh để bóc tách tiêu chí, tính điểm số đối chiếu minh bạch và tạo đề xuất mẫu.
- Kết quả trên giao diện được gắn nhãn rõ ràng: **"Demo Mode / Mock AI Provider"**.
- Có sẵn nút **"Tải dữ liệu mẫu"** tại trang `/analyze` để điền nhanh bộ dữ liệu CV và JD của Senior Fullstack Developer (Python/React) chỉ với 1 cú nhấp.

### Chế độ AI Thật (OpenAI Structured Outputs)
1. Đăng ký và lấy API Key từ [OpenAI Platform](https://platform.openai.com/).
2. Cập nhật tệp `.env`:
   ```ini
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```
3. Khởi động lại Backend. Hệ thống sẽ sử dụng OpenAI SDK với cơ chế **Structured Outputs** (Pydantic schema enforcement) kèm hệ thống prompt bảo vệ an toàn (Prompt Injection Guardrails). Nếu khóa API không hợp lệ, hệ thống sẽ báo lỗi cấu hình minh bạch thay vì âm thầm trả kết quả giả mạo.

---

## 8. Hướng dẫn chạy Kiểm thử, Linting & Build

### Kiểm thử Backend (Pytest):
```powershell
cd d:\MyProject\backend
python -m pytest tests/ -v
```
*Kết quả thực tế đã chạy:* **43/43 tests PASSED (100%)** bao gồm:
- Xác minh thuật toán tính điểm và trọng số (`test_scoring.py`).
- Xác thực trích dẫn nguyên văn bằng chứng (`test_verify_evidence`).
- Bảo mật tệp: phát hiện file rỗng, vượt quá 10MB, định dạng giả mạo magic bytes, chống path traversal (`test_file_parser.py`).
- Phát hiện PDF dạng scan/ảnh không có văn bản và thông báo rõ ràng.
- CRUD lịch sử phân tích trong DB (`test_history.py`).
- Quy trình phân tích toàn diện và xuất file PDF/DOCX (`test_api.py`).

### Kiểm tra kiểu tĩnh Frontend (TypeScript Typecheck):
```powershell
cd d:\MyProject\frontend
npm run typecheck
```
*Kết quả:* **0 lỗi TypeScript**.

### Biên dịch Frontend Production (Next.js Build):
```powershell
cd d:\MyProject\frontend
npm run build
```
*Kết quả:* Tất cả các trang tĩnh `/`, `/analyze`, `/results`, `/history` biên dịch thành công tối ưu qua Next.js Turbopack.

---

## 9. Công thức tính điểm minh bạch (Scoring Engine)

Điểm số đối chiếu được tính toán **hoàn toàn tất định (deterministic) bằng mã nguồn Python phía backend**, tuyệt đối không phụ thuộc vào điểm số tùy ý do LLM đưa ra:

### Bảng trọng số độ ưu tiên yêu cầu (Priority Weights):
- **Bắt buộc (`required`):** Trọng số = `3`
- **Ưu tiên (`preferred`):** Trọng số = `2`
- **Điểm cộng (`nice_to_have`):** Trọng số = `1`

### Bảng điểm bằng chứng (Evidence Scores):
- **Khớp rõ ràng (`match`):** Điểm bằng chứng = `1.0`
- **Khớp một phần / Thiếu số liệu (`partial_match`):** Điểm bằng chứng = `0.5`
- **Chưa có bằng chứng (`not_evidenced`):** Điểm bằng chứng = `0.0`

### Công thức:
$$\text{match\_score} = \text{round}\left(100 \times \frac{\sum (\text{priority\_weight} \times \text{evidence\_score})}{\sum \text{priority\_weight}}\right)$$

*Trường hợp danh sách yêu cầu rỗng, điểm số an toàn mặc định là `0`.*

---

## 10. Tài liệu REST API

| Phương thức | Đường dẫn | Tham số chính | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | Kiểm tra trạng thái máy chủ và AI Provider |
| `POST` | `/api/v1/analyze` | `cv_file`, `jd_text` hoặc `jd_file`, `output_language`, `save_to_history` | Phân tích đối chiếu hồ sơ với JD (Multipart form) |
| `GET` | `/api/v1/history` | `skip`, `limit` | Lấy danh sách tóm tắt các lần phân tích đã lưu |
| `GET` | `/api/v1/history/{id}` | `analysis_id` | Lấy chi tiết toàn diện của một bản phân tích |
| `DELETE` | `/api/v1/history/{id}` | `analysis_id` | Xóa vĩnh viễn một bản phân tích khỏi cơ sở dữ liệu |
| `POST` | `/api/v1/exports/report.pdf` | `analysis_data` | Xuất và tải xuống bản báo cáo phân tích định dạng PDF |
| `POST` | `/api/v1/exports/cv.docx` | `cv_profile`, `approved_suggestion_ids`, `suggestions` | Xuất và tải về bản thảo CV Microsoft Word đã tinh chỉnh |

---

## 11. Bảo mật & Quyền riêng tư (Security & Privacy)

1. **Nguyên tắc riêng tư số 1:** Hệ thống **mặc định không lưu trữ** tệp tin gốc tải lên hay toàn văn CV của người dùng trên ổ đĩa. Quá trình xử lý diễn ra trong bộ nhớ tạm thời với tên sinh ngẫu nhiên an toàn và được dọn dẹp triệt để trong khối `finally`.
2. **Lưu lịch sử có sự đồng thuận (Opt-in):** Chỉ khi người dùng chủ động đánh dấu chọn *"Lưu kết quả này vào lịch sử phân tích"*, dữ liệu báo cáo dạng cấu trúc JSON mới được ghi vào cơ sở dữ liệu.
3. **An toàn trước các cuộc tấn công:**
   - Kiểm tra magic bytes và extension để ngăn chặn tệp độc hại giả mạo đuôi file.
   - Giới hạn cứng dung lượng tệp tải lên (mặc định 10MB) và độ dài ký tự tối đa (60.000 ký tự) nhằm tránh tấn công cạn kiệt tài nguyên (DoS).
   - Khử khuẩn hoàn toàn tên tệp xuất và đường dẫn nhằm ngăn ngừa tấn công Path Traversal.
   - Tuyệt đối không log toàn văn CV, thông tin liên lạc cá nhân hay khóa bí mật API Key ra console.
4. **Lưu ý trước khi triển khai công khai (Production Deployment):**
   - Phiên bản hiện tại phục vụ môi trường nội bộ/cá nhân (Single-user mode). Khi triển khai ra công chúng, cần bổ sung hệ thống xác thực người dùng (User Authentication - JWT/OAuth2), phân tách dữ liệu đa người dùng (Multi-tenancy), HTTPS bắt buộc và chính sách thời hạn lưu trữ dữ liệu (Data Retention Policy).

---

## 12. Xử lý sự cố thường gặp (Troubleshooting)

- **Lỗi `Cannot load npm.ps1 because running scripts is disabled` (Windows):**  
  Mở PowerShell với quyền Administrator và chạy lệnh: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **Lỗi `Failed to fetch` khi vào trang Lịch sử hoặc Phân tích:**  
  Kiểm tra Backend FastAPI đã chạy chưa (truy cập `http://localhost:8000/api/v1/health`). Kiểm tra cấu hình `FRONTEND_ORIGINS` trong `.env` đã có `http://localhost:3000`.
- **Tệp PDF là tài liệu scan:**  
  Nếu bạn tải lên tệp PDF scan không có lớp text kỹ thuật số (dưới 50 ký tự trích xuất được), hệ thống sẽ từ chối phân tích và đưa ra thông báo yêu cầu cung cấp tệp PDF có text hoặc chuyển đổi OCR trước.

---

## 13. Giấy phép (License)
Dự án được phân phối dưới giấy phép mã nguồn mở MIT.
