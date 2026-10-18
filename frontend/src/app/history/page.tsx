'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnalysisSummary } from '@/lib/types';
import { getHistoryList, getHistoryDetail, deleteHistoryItem } from '@/lib/api';
import { SESSION_STORAGE_KEYS } from '@/lib/constants';
import { formatDate, getScoreColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  History,
  Trash2,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  Calendar,
  User,
  CheckCircle2,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shadow-xs">
              <History className="w-6 h-6 text-blue-700" />
            </div>
            <span>Lịch sử phân tích hồ sơ</span>
          </h1>
          <p className="text-sm text-slate-700 font-medium mt-1.5">
            Danh sách các hồ sơ đã được lưu trữ an toàn trong cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            leftIcon={<RotateCcw className="w-4 h-4 text-slate-700" />}
            disabled={isLoading}
            className="border-2 border-slate-300 text-slate-800 font-bold hover:bg-slate-100"
          >
            Làm mới
          </Button>

          <Link href="/analyze">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
            >
              Phân tích mới
            </Button>
          </Link>
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="p-8 rounded-2xl bg-rose-50 border-2 border-rose-300 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-rose-950">
              Không thể kết nối với máy chủ API
            </h3>
            <p className="text-sm text-rose-800 font-semibold leading-relaxed">
              {errorMsg}. Hãy đảm bảo máy chủ backend đang chạy ở cổng cấu hình (mặc định <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-900 font-mono text-xs">http://localhost:8000</code>).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            className="border-2 border-rose-300 text-rose-900 bg-white hover:bg-rose-100 font-bold"
          >
            Thử lại kết nối
          </Button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border-2 border-slate-200 bg-white animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2.5 w-1/2">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="h-10 w-28 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !errorMsg && historyList.length === 0 && (
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-950">
            Chưa có lịch sử phân tích nào
          </h3>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            Khi thực hiện phân tích CV và kích hoạt tùy chọn &ldquo;Lưu vào lịch sử&rdquo;, các kết quả sẽ xuất hiện ở đây để bạn dễ dàng tra cứu lại.
          </p>
          <div className="pt-2">
            <Link href="/analyze">
              <Button variant="primary" size="md" className="font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Bắt đầu phân tích CV ngay
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* LIST OF HISTORY CARDS */}
      {!isLoading && !errorMsg && historyList.length > 0 && (
        <div className="space-y-4">
          {historyList.map((item) => {
            const scoreColor = getScoreColor(item.overall_score);
            const isOpening = openingId === item.id;

            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl border-2 border-slate-200 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left meta */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-black text-slate-950">
                      {item.job_title || 'Vị trí chưa đặt tên'}
                    </h3>

                    {item.is_demo_mode && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Demo Mock
                      </span>
                    )}

                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                      {item.provider.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-semibold">
                    {item.candidate_name && (
                      <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{item.candidate_name}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>
                    <span className="font-mono text-slate-500 text-xs">
                      ID: {item.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Requirements breakdown quick view */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Khớp: {item.matched}/{item.total_requirements}
                    </span>
                    <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 font-bold">
                      Một phần: {item.partial}
                    </span>
                    <span className="text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 font-bold">
                      Chưa có: {item.not_evidenced}
                    </span>
                  </div>
                </div>

                {/* Right score and action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-200">
                  {/* Score badge */}
                  <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl bg-slate-100 border-2 border-slate-200 min-w-[84px] shadow-xs">
                    <span className="text-2xl font-black" style={{ color: scoreColor.fill }}>
                      {item.overall_score}%
                    </span>
                    <span className="text-[11px] text-slate-600 uppercase font-black tracking-wider">Điểm khớp</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isOpening}
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                      onClick={() => handleOpenItem(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs px-4 py-2"
                    >
                      Xem chi tiết
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-rose-700 hover:bg-rose-100 p-2.5 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
                      onClick={() => setDeletingItem(item)}
                      aria-label="Xóa bản ghi này"
                    >
                      <Trash2 className="w-5 h-5" />
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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-950">
                Xác nhận xóa bản ghi phân tích?
              </h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Hành động này không thể hoàn tác. Bản ghi đối chiếu cho vị trí &ldquo;
                <strong className="text-slate-900 font-bold">{deletingItem.job_title || 'Vị trí này'}</strong>&rdquo; sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeletingItem(null)}
                className="border-2 border-slate-300 font-bold text-slate-800"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
