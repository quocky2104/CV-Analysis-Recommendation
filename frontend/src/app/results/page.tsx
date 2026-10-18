'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AnalysisResponse,
  UserSuggestionState,
} from '@/lib/types';
import { SESSION_STORAGE_KEYS } from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';
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
  TrendingUp,
  Tag,
  ShieldAlert,
  Calendar,
  Briefcase,
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
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Đang tải kết quả phân tích...</p>
      </div>
    );
  }

  // Empty state if user navigated directly without analyzing
  if (!analysisData) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
          <FileSearch className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chưa có dữ liệu phân tích nào
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Bạn chưa thực hiện phiên phân tích hồ sơ nào hoặc phiên làm việc đã hết hạn. Hãy tải lên CV và JD để bắt đầu.
        </p>
        <div className="pt-2">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
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
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] block text-amber-700 dark:text-amber-300">
              Chế độ Demo / Mock AI Provider
            </span>
            <p className="leading-relaxed">
              Hệ thống hiện đang sử dụng bộ phân tích mô phỏng nội bộ do chưa cấu hình khóa API OpenAI (OPENAI_API_KEY).
              Dữ liệu hiển thị mang tính minh họa chính xác các cấu trúc dữ liệu thực tế.
            </p>
          </div>
        </div>
      )}

      {/* Header bar: Title & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(analysisData.timestamp)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              ID: {analysisData.analysis_id.slice(0, 8)}
            </span>
            <span>•</span>
            <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Provider: {analysisData.provider}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Báo cáo đối chiếu:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {analysisData.job_title || 'Vị trí tuyển dụng'}
            </span>
          </h1>

          {analysisData.cv_profile?.name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Ứng viên: <strong>{analysisData.cv_profile.name}</strong></span>
              {analysisData.cv_profile.email && <span>({analysisData.cv_profile.email})</span>}
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
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Bắt buộc (Must-Have)
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                  3x Trọng số
                </span>
              </div>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-100">
                {scores.required_score}%
              </p>
              <Progress value={scores.required_score} barColor="danger" />
              <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-snug">
                Tiêu chuẩn quyết định loại hồ sơ ở vòng sơ tuyển ATS.
              </p>
            </div>

            {/* Preferred Breakdown */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Ưu tiên (Preferred)
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  2x Trọng số
                </span>
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-100">
                {scores.preferred_score}%
              </p>
              <Progress value={scores.preferred_score} barColor="warning" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                Giúp ứng viên cạnh tranh với nhóm ứng viên tiềm năng khác.
              </p>
            </div>

            {/* Nice to have Breakdown */}
            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  Điểm cộng (Bonus)
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-200/60 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                  1x Trọng số
                </span>
              </div>
              <p className="text-2xl font-black text-sky-900 dark:text-sky-100">
                {scores.nice_to_have_score}%
              </p>
              <Progress value={scores.nice_to_have_score} barColor="primary" />
              <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-snug">
                Lợi thế bổ sung giúp thương lượng mức lương và đãi ngộ.
              </p>
            </div>
          </div>

          {/* Expandable Scoring Explanation */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Cách thức tính điểm trọng số minh bạch</span>
              </span>
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExplanation && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                <p>{analysisData.scoring_explanation}</p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-[11px]">
                  Điểm = (Khớp x 1.0 + Một phần x 0.5) x Trọng số / Tổng trọng số khả dụng x 100
                </div>
              </div>
            )}
          </div>

          {/* Critical Gaps Alert (if any) */}
          {scores.critical_gaps && scores.critical_gaps.length > 0 && (
            <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Lỗ hổng bắt buộc ({scores.critical_gaps.length} tiêu chí chưa thấy bằng chứng)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-700 dark:text-rose-300">
                {scores.critical_gaps.map((gap, i) => (
                  <li key={i} className="font-medium">
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Bảng đối chiếu yêu cầu tuyển dụng chi tiết
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mỗi tiêu chí trong JD được so khớp và trích xuất câu chữ thực tế từ hồ sơ ứng viên.
          </p>
        </div>

        <RequirementTable matches={requirement_matches} />
      </div>

      {/* SECTION 3: STRENGTHS & GAPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                Điểm mạnh nổi bật
              </h3>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300">
                Kinh nghiệm và kỹ năng vượt trội so với yêu cầu JD
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-800 dark:text-slate-200">
            {strengths && strengths.length > 0 ? (
              strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">Không có điểm mạnh nổi bật nào được ghi nhận.</li>
            )}
          </ul>
        </div>

        {/* Gaps */}
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
                Lỗ hổng & Điểm cần bổ sung
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300">
                Các khía cạnh ứng viên chưa thể hiện rõ trong hồ sơ
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-800 dark:text-slate-200">
            {gaps && gaps.length > 0 ? (
              gaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">✕</span>
                  <span>{gap}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">Hồ sơ bao phủ toàn bộ các tiêu chí chính của JD.</li>
            )}
          </ul>
        </div>
      </div>

      {/* SECTION 4: KEYWORD & TERMINOLOGY ANALYSIS */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Phân tích từ khóa ATS & Thuật ngữ chuyên ngành</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Các hệ thống ATS thường quét các từ khóa cụ thể trước khi chuyển hồ sơ cho phòng tuyển dụng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Found keywords */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Từ khóa đã xuất hiện trong CV ({keyword_analysis.found_in_cv.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {keyword_analysis.found_in_cv.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Missing keywords */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              Từ khóa quan trọng còn thiếu ({keyword_analysis.missing_from_cv.length})
            </span>
            <div className="space-y-2">
              {keyword_analysis.missing_from_cv.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      {item.keyword}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold px-2 py-0.2 rounded-full',
                        item.importance === 'high'
                          ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      Mức độ: {item.importance}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminology equivalents */}
        {keyword_analysis.terminology_equivalents && keyword_analysis.terminology_equivalents.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Thuật ngữ tương đương được hệ thống nhận diện
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {keyword_analysis.terminology_equivalents.map((eq, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">JD: {eq.jd_term}</span>
                    <span className="text-slate-400">↔</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">CV: {eq.cv_term}</span>
                  </div>
                  {eq.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400">{eq.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: QUALITY REVIEW */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Đánh giá chất lượng trình bày CV</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đo lường độ mạch lạc, chứng cứ định lượng và tính thuyết phục của hồ sơ trên thang điểm 5.0.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-semibold">Điểm chất lượng:</span>
            <span className="text-lg font-black">{quality_review.overall_quality_score.toFixed(1)} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clarity */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Độ rõ ràng & Dễ hiểu (Clarity)</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {quality_review.clarity.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.clarity.score / 5.0) * 100} barColor="primary" />
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{quality_review.clarity.reason}</p>
          </div>

          {/* Relevance */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Tính phù hợp vai trò (Relevance)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {quality_review.relevance.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.relevance.score / 5.0) * 100} barColor="success" />
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{quality_review.relevance.reason}</p>
          </div>

          {/* Impact Evidence */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Bằng chứng định lượng (Impact Evidence)</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {quality_review.impact_evidence.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.impact_evidence.score / 5.0) * 100} barColor="warning" />
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{quality_review.impact_evidence.reason}</p>
          </div>

          {/* Structure */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Bố cục & Cấu trúc (Structure)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {quality_review.structure.score.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress value={(quality_review.structure.score / 5.0) * 100} barColor="primary" />
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{quality_review.structure.reason}</p>
          </div>
        </div>
      </div>

      {/* SECTION 6: REVISION SUGGESTIONS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Đề xuất tối ưu hóa CV chi tiết</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Hoàn tất xem xét hồ sơ?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xuất báo cáo PDF đối chiếu hoặc tải về CV Microsoft Word (.docx) kèm các cải tiến bạn đã duyệt.
          </p>
        </div>

        <ExportActions analysisData={analysisData} suggestionStates={suggestionStates} />
      </div>
    </div>
  );
}
