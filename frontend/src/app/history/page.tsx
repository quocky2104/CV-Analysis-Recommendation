'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnalysisSummary } from '@/lib/types';
import { getHistoryList, getHistoryDetail, deleteHistoryItem } from '@/lib/api';
import { SESSION_STORAGE_KEYS } from '@/lib/constants';
import { formatDate, getScoreColor, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  History,
  Trash2,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  Calendar,
  Briefcase,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryPage() {
  const router = useRouter();

  const [historyList, setHistoryList] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Loading state when opening a specific history item
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Deletion modal state
  const [deletingItem, setDeletingItem] = useState<AnalysisSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await getHistoryList();
      setHistoryList(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối với máy chủ API.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenItem = async (item: AnalysisSummary) => {
    try {
      setOpeningId(item.id);
      const fullAnalysis = await getHistoryDetail(item.id);

      // Store in sessionStorage so results page can display it
      sessionStorage.setItem(SESSION_STORAGE_KEYS.LATEST_ANALYSIS, JSON.stringify(fullAnalysis));
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.SUGGESTION_STATES);

      router.push('/results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết hồ sơ.';
      toast.error(msg);
      setOpeningId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      await deleteHistoryItem(deletingItem.id);
      setHistoryList((prev) => prev.filter((i) => i.id !== deletingItem.id));
      toast.success('Đã xóa bản ghi phân tích thành công.');
      setDeletingItem(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa bản ghi thất bại.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-10 md:py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Lịch sử phân tích hồ sơ</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Danh sách các hồ sơ đã được lưu trữ trong cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            disabled={isLoading}
          >
            Làm mới
          </Button>

          <Link href="/analyze">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Phân tích mới
            </Button>
          </Link>
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
            Không thể tải dữ liệu lịch sử
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">
            {errorMsg}. Hãy đảm bảo máy chủ backend đang chạy ở cổng cấu hình (mặc định http://localhost:8000).
          </p>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            Thử lại
          </Button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !errorMsg && historyList.length === 0 && (
        <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Chưa có lịch sử phân tích nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Khi thực hiện phân tích CV và kích hoạt tùy chọn &ldquo;Lưu vào lịch sử&rdquo;, các kết quả sẽ xuất hiện ở đây để bạn dễ dàng tra cứu lại.
          </p>
          <div className="pt-2">
            <Link href="/analyze">
              <Button variant="primary" size="md">
                Bắt đầu phân tích CV ngay
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* LIST OF HISTORY CARDS */}
      {!isLoading && !errorMsg && historyList.length > 0 && (
        <div className="space-y-3.5">
          {historyList.map((item) => {
            const scoreColor = getScoreColor(item.overall_score);
            const isOpening = openingId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left meta */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.job_title || 'Vị trí chưa đặt tên'}
                    </h3>

                    {item.is_demo_mode && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        Demo Mock
                      </span>
                    )}

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.provider}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {item.candidate_name && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.candidate_name}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      ID: {item.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Requirements breakdown quick view */}
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Khớp: {item.matched}/{item.total_requirements}
                    </span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      Một phần: {item.partial}
                    </span>
                    <span>•</span>
                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                      Chưa có: {item.not_evidenced}
                    </span>
                  </div>
                </div>

                {/* Right score and action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  {/* Score badge */}
                  <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 min-w-[70px]">
                    <span className="text-lg font-black" style={{ color: scoreColor.fill }}>
                      {item.overall_score}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Điểm khớp</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isOpening}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenItem(item)}
                    >
                      Xem chi tiết
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 p-2"
                      onClick={() => setDeletingItem(item)}
                      aria-label="Xóa bản ghi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xác nhận xóa bản ghi phân tích?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hành động này không thể hoàn tác. Bản ghi đối chiếu cho vị trí &ldquo;
                <strong>{deletingItem.job_title || 'Vị trí này'}</strong>&rdquo; sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeletingItem(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
