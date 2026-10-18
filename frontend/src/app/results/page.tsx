'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AnalysisResponse,
  UserSuggestionState,
} from '@/lib/types';
import { SESSION_STORAGE_KEYS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { ScoreDisplay } from '@/components/results/score-display';
import { RequirementTable } from '@/components/results/requirement-table';
import { SuggestionsPanel } from '@/components/results/suggestions-panel';
import { ExportActions } from '@/components/results/export-actions';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  ArrowRight,
  Tag,
  ShieldAlert,
  Calendar,
  User,
} from 'lucide-react';

export default function ResultsPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [suggestionStates, setSuggestionStates] = useState<Record<string, UserSuggestionState>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEYS.LATEST_ANALYSIS);
      if (stored) {
        const parsed: AnalysisResponse = JSON.parse(stored);
        setAnalysisData(parsed);

        // Load or initialize suggestion states
        const storedStates = sessionStorage.getItem(SESSION_STORAGE_KEYS.SUGGESTION_STATES);
        if (storedStates) {
          setSuggestionStates(JSON.parse(storedStates));
        } else {
          const initialStates: Record<string, UserSuggestionState> = {};
          parsed.suggestions.forEach((s) => {
            initialStates[s.id] = { status: 'pending' };
          });
          setSuggestionStates(initialStates);
        }
      }
    } catch {
      // JSON parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a suggestion's state and persist
  const handleUpdateSuggestionState = (id: string, state: UserSuggestionState) => {
    setSuggestionStates((prev) => {
      const updated = { ...prev, [id]: state };
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SUGGESTION_STATES, JSON.stringify(updated));
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-base font-bold text-slate-700">Đang tải kết quả phân tích...</p>
      </div>
    );
  }

  // Empty state if user navigated directly without analyzing
  if (!analysisData) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 mx-auto shadow-xs">
          <FileSearch className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-950">
          Chưa có dữ liệu phân tích nào
        </h2>
        <p className="text-sm text-slate-700 font-medium max-w-md mx-auto leading-relaxed">
          Bạn chưa thực hiện phiên phân tích hồ sơ nào hoặc phiên làm việc đã hết hạn. Hãy tải lên CV và JD để bắt đầu.
        </p>
        <div className="pt-2">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
          >
            <span>Tới trang Phân tích CV</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { scores, requirement_matches, strengths, gaps, keyword_analysis, quality_review, suggestions } =
    analysisData;

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Demo Mode Alert Banner */}
      {analysisData.is_demo_mode && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3.5 text-amber-950 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-black uppercase tracking-wider text-xs block text-amber-900">
              Chế độ Demo / Mock AI Provider
            </span>
            <p className="leading-relaxed font-medium text-amber-900">
              Hệ thống hiện đang sử dụng bộ phân tích mô phỏng dựa trên luật suy diễn (rule-based) do chưa cấu hình khóa API OpenAI (OPENAI_API_KEY).
              Dữ liệu hiển thị mang tính minh họa chính xác các cấu trúc dữ liệu và điểm số theo công thức thực tế.
            </p>
          </div>
        </div>
      )}

      {/* Header bar: Title & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(analysisData.timestamp)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-slate-600">
              ID: {analysisData.analysis_id.slice(0, 8)}
            </span>
            <span>•</span>
            <span className="uppercase text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
              Provider: {analysisData.provider}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex flex-wrap items-center gap-2">
            <span>Báo cáo đối chiếu:</span>
            <span className="text-blue-700">
              {analysisData.job_title || 'Vị trí tuyển dụng'}
            </span>
          </h1>

          {analysisData.cv_profile?.name && (
            <p className="text-xs text-slate-700 mt-1.5 flex items-center gap-2 font-bold">
              <User className="w-4 h-4 text-slate-500" />
              <span>Ứng viên: <strong>{analysisData.cv_profile.name}</strong></span>
              {analysisData.cv_profile.email && <span className="text-slate-500 font-normal">({analysisData.cv_profile.email})</span>}
            </p>
          )}
        </div>

        {/* Top Export Actions */}
        <ExportActions analysisData={analysisData} suggestionStates={suggestionStates} />
      </div>

      {/* SECTION 1: OVERALL SCORE & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radial Chart Display */}
        <div className="lg:col-span-1">
          <ScoreDisplay
            score={scores.overall_score}
            totalRequirements={scores.total_requirements}
            matchedCount={scores.matched}
            partialCount={scores.partial}
            notEvidencedCount={scores.not_evidenced}
          />
        </div>

        {/* Weighted breakdown cards */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Required Breakdown */}
            <div className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/60 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                  Bắt buộc (Must-Have)
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 border border-rose-300">
                  3x Trọng số
                </span>
              </div>
              <p className="text-3xl font-black text-rose-950">
                {scores.required_score}%
              </p>
              <Progress value={scores.required_score} barColor="danger" />
              <p className="text-xs text-rose-800 font-medium leading-snug">
                Tiêu chuẩn quyết định loại hồ sơ ở vòng sơ tuyển ATS.
              </p>
            </div>

            {/* Preferred Breakdown */}
            <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/60 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Ưu tiên (Preferred)
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300">
                  2x Trọng số
                </span>
              </div>
              <p className="text-3xl font-black text-amber-950">
                {scores.preferred_score}%
              </p>
              <Progress value={scores.preferred_score} barColor="warning" />
              <p className="text-xs text-amber-800 font-medium leading-snug">
                Giúp ứng viên cạnh tranh với nhóm ứng viên tiềm năng khác.
              </p>
            </div>

            {/* Nice to have Breakdown */}
            <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/60 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  Điểm cộng (Bonus)
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 border border-blue-300">
                  1x Trọng số
                </span>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {scores.nice_to_have_score}%
              </p>
              <Progress value={scores.nice_to_have_score} barColor="primary" />
              <p className="text-xs text-blue-800 font-medium leading-snug">
                Lợi thế bổ sung giúp thương lượng mức lương và đãi ngộ.
              </p>
            </div>
          </div>

          {/* Expandable Scoring Explanation */}
          <div className="border-2 border-slate-200 rounded-2xl bg-white p-4 shadow-xs">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-800 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Cách thức tính điểm trọng số minh bạch</span>
              </span>
              {showExplanation ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-700" />}
            </button>

            {showExplanation && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                <p className="font-medium">{analysisData.scoring_explanation}</p>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                  Điểm = (Khớp x 1.0 + Một phần x 0.5) x Trọng số / Tổng trọng số khả dụng x 100
                </div>
              </div>
            )}
          </div>

          {/* Critical Gaps Alert (if any) */}
          {scores.critical_gaps && scores.critical_gaps.length > 0 && (
            <div className="p-4 rounded-2xl border-2 border-rose-300 bg-rose-50 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-rose-950 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                <span>Lỗ hổng bắt buộc ({scores.critical_gaps.length} tiêu chí chưa thấy bằng chứng)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-900 font-medium">
                {scores.critical_gaps.map((gap, i) => (
                  <li key={i}>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: REQUIREMENT MATCHES TABLE */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Bảng đối chiếu yêu cầu tuyển dụng chi tiết
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Mỗi tiêu chí trong JD được so khớp và trích xuất câu chữ thực tế từ hồ sơ ứng viên.
          </p>
        </div>

        <RequirementTable matches={requirement_matches} />
      </div>

      {/* SECTION 3: STRENGTHS & GAPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950">
                Điểm mạnh nổi bật
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Kinh nghiệm và kỹ năng vượt trội so với yêu cầu JD
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-800 font-medium">
            {strengths && strengths.length > 0 ? (
              strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">Không có điểm mạnh nổi bật nào được ghi nhận.</li>
            )}
          </ul>
        </div>

        {/* Gaps */}
        <div className="p-6 rounded-2xl border-2 border-rose-300 bg-rose-50/50 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-950">
                Lỗ hổng &amp; Điểm cần bổ sung
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                Các khía cạnh ứng viên chưa thể hiện rõ trong hồ sơ
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-800 font-medium">
            {gaps && gaps.length > 0 ? (
              gaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-rose-700 font-bold shrink-0">✕</span>
                  <span>{gap}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">Hồ sơ bao phủ toàn bộ các tiêu chí chính của JD.</li>
            )}
          </ul>
        </div>
      </div>

      {/* SECTION 4: KEYWORD & TERMINOLOGY ANALYSIS */}
      <div className="p-6 rounded-2xl border-2 border-slate-200 bg-white shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Phân tích từ khóa ATS &amp; Thuật ngữ chuyên ngành</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Các hệ thống ATS thường quét các từ khóa cụ thể trước khi chuyển hồ sơ cho phòng tuyển dụng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Found keywords */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">
              Từ khóa đã xuất hiện trong CV ({keyword_analysis.found_in_cv.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {keyword_analysis.found_in_cv.map((kw, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Missing keywords */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-rose-800 uppercase tracking-wider block">
              Từ khóa quan trọng còn thiếu ({keyword_analysis.missing_from_cv.length})
            </span>
            <div className="space-y-2">
              {keyword_analysis.missing_from_cv.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-rose-300 bg-rose-50 flex flex-col gap-1 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 text-sm">
                      {item.keyword}
                    </span>
                    <span
                      className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300"
                    >
                      Mức độ: {item.importance}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminology equivalents */}
        {keyword_analysis.terminology_equivalents && keyword_analysis.terminology_equivalents.length > 0 && (
          <div className="pt-4 border-t-2 border-slate-200 space-y-2.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Thuật ngữ tương đương được hệ thống nhận diện
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {keyword_analysis.terminology_equivalents.map((eq, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs space-y-1 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950">JD: {eq.jd_term}</span>
                    <span className="text-slate-400 font-bold">↔</span>
                    <span className="font-bold text-blue-700">CV: {eq.cv_term}</span>
                  </div>
                  {eq.notes && <p className="text-xs text-slate-600 font-medium">{eq.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: QUALITY REVIEW */}
      <div className="p-6 rounded-2xl border-2 border-slate-200 bg-white shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-700" />
              <span>Đánh giá chất lượng trình bày CV</span>
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Đo lường độ mạch lạc, chứng cứ định lượng và tính thuyết phục của hồ sơ trên thang điểm 5.0.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-50 text-indigo-900 border-2 border-indigo-200">
            <span className="text-xs font-bold">Điểm chất lượng:</span>
            <span className="text-xl font-black">{quality_review.overall_quality_score.toFixed(1)} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Clarity */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Độ rõ ràng &amp; Dễ hiểu (Clarity)</span>
              <span className="font-mono text-blue-700 font-bold">
                {quality_review.clarity.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.clarity.score / 5.0) * 100} barColor="primary" />
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{quality_review.clarity.reason}</p>
          </div>

          {/* Relevance */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Tính phù hợp vai trò (Relevance)</span>
              <span className="font-mono text-emerald-700 font-bold">
                {quality_review.relevance.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.relevance.score / 5.0) * 100} barColor="success" />
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{quality_review.relevance.reason}</p>
          </div>

          {/* Impact Evidence */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Bằng chứng định lượng (Impact Evidence)</span>
              <span className="font-mono text-amber-700 font-bold">
                {quality_review.impact_evidence.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.impact_evidence.score / 5.0) * 100} barColor="warning" />
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{quality_review.impact_evidence.reason}</p>
          </div>

          {/* Structure */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Bố cục &amp; Cấu trúc (Structure)</span>
              <span className="font-mono text-indigo-700 font-bold">
                {quality_review.structure.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.structure.score / 5.0) * 100} barColor="primary" />
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{quality_review.structure.reason}</p>
          </div>
        </div>
      </div>

      {/* SECTION 6: REVISION SUGGESTIONS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Đề xuất tối ưu hóa CV chi tiết</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Phê duyệt hoặc tùy biến chỉnh sửa để tải về bản CV định dạng Word (.docx) được tối ưu hoá riêng cho vị trí này.
          </p>
        </div>

        <SuggestionsPanel
          suggestions={suggestions}
          suggestionStates={suggestionStates}
          onUpdateState={handleUpdateSuggestionState}
        />
      </div>

      {/* Bottom Export Actions */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-base font-black text-slate-950">
            Hoàn tất xem xét hồ sơ?
          </h4>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Xuất báo cáo PDF đối chiếu hoặc tải về CV Microsoft Word (.docx) kèm các cải tiến bạn đã duyệt.
          </p>
        </div>

        <ExportActions analysisData={analysisData} suggestionStates={suggestionStates} />
      </div>
    </div>
  );
}
