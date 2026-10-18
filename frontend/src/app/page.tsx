import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Cpu,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Target,
  FileText,
  Search,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Trợ lý đối chiếu hồ sơ tuyển dụng chuyên nghiệp</span>
            </div>

            {/* Gradient Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Phân tích CV chuẩn xác theo{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Mô tả Công việc
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Đánh giá mức độ phù hợp thực tế dựa trên <strong>bằng chứng xác thực</strong> từ hồ sơ ứng viên,
              loại bỏ phỏng đoán cảm tính và tối ưu hóa CV theo tiêu chuẩn khắt khe của nhà tuyển dụng.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/analyze"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>Bắt đầu phân tích ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/history"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>Lịch sử phân tích</span>
              </Link>
            </div>
          </div>

          {/* Interactive Feature Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-500 ml-2">Báo cáo đối chiếu mẫu</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Độ phù hợp: 88%
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500">Tiêu chí Bắt buộc</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">92%</p>
                <span className="text-xs text-emerald-600 font-medium">11/12 yêu cầu có bằng chứng</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500">Tiêu chí Ưu tiên</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">85%</p>
                <span className="text-xs text-emerald-600 font-medium">Docker, CI/CD, TypeScript</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500">Chất lượng CV</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">4.6 / 5.0</p>
                <span className="text-xs text-blue-600 font-medium">Bố cục chuẩn & số liệu rõ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Quy trình đơn giản
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              3 bước để đạt điểm phù hợp cao nhất
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
              CVision AI phân tích đối chiếu từng kỹ năng và kinh nghiệm thực tế của bạn với yêu cầu nhà tuyển dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-5">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                Bước 1
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Tải lên CV & Nhập JD
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tải tệp CV (PDF/DOCX) và dán hoặc tải lên nội dung bản mô tả công việc (JD) của vị trí bạn quan tâm.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Bước 2
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Đối chiếu & Trích dẫn bằng chứng
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Hệ thống AI bóc tách từng yêu cầu bắt buộc và ưu tiên, trích xuất chính xác câu văn chứng minh từ hồ sơ.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-5">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                Bước 3
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Tối ưu hóa & Xuất tài liệu
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Xem xét và phê duyệt các gợi ý cải tiến cụ thể, sau đó tải về CV Word (.docx) đã tinh chỉnh và báo cáo PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Công nghệ tiên tiến
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              Tính năng hỗ trợ chuyên sâu
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
              Mọi tính năng được xây dựng nhằm phản ánh chân thực các vòng sàng lọc hồ sơ tự động (ATS) và nhà tuyển dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Bằng chứng trích xuất nguyên văn
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mỗi tiêu chí khớp hay thiếu hụt đều được đối chiếu trực tiếp với từng câu văn cụ thể trong CV, hoàn toàn không có ảo tưởng (hallucination).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Tính điểm trọng số minh bạch
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Phân loại rành mạch: Bắt buộc (Must-Have x3), Ưu tiên (Preferred x2) và Điểm cộng (Nice-to-Have x1) để phản ánh đúng ưu tiên tuyển dụng.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Đánh giá chất lượng 4 khía cạnh
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Chấm điểm trên thang 5.0 về độ rõ ràng (Clarity), tính liên quan (Relevance), bằng chứng định lượng (Impact) và bố cục hồ sơ (Structure).
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Xuất CV Word (.docx) tối ưu
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Duyệt và điều chỉnh các đề xuất nâng cấp câu từ, sau đó tải về bản CV định dạng Microsoft Word hoàn chỉnh chỉ với 1 cú nhấp.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Phân tích từ khóa ATS
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Xác định các từ khóa kỹ thuật chuyên ngành còn thiếu và nhận diện các thuật ngữ tương đương giữa hồ sơ và JD.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Xuất báo cáo PDF chi tiết
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tạo bản báo cáo PDF chuyên nghiệp lưu trữ toàn bộ phân tích điểm số, điểm mạnh và lỗ hổng cần cải thiện.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Section */}
      <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bảo vệ dữ liệu cá nhân là nguyên tắc số 1
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tài liệu của bạn chỉ được xử lý trong phiên làm việc để tạo kết quả phân tích. Hệ thống không tự động lưu dữ liệu lên cơ sở dữ liệu trừ khi bạn chủ động chọn &ldquo;Lưu vào lịch sử&rdquo;. Thông tin không bao giờ được chia sẻ với bất kỳ bên thứ ba nào.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sẵn sàng kiểm tra độ phù hợp của CV với vị trí mơ ước?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto">
            Chỉ mất chưa đầy 30 giây để có được bản đối chiếu đa chiều và kế hoạch tối ưu CV chính xác.
          </p>
          <div className="pt-2">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-lg"
            >
              <span>Tải CV & Bắt đầu phân tích</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
