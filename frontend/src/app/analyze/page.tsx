'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Layers,
  CheckCircle,
  FileUp,
  FileCheck,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeCV } from '@/lib/api';
import {
  ACCEPTED_CV_TYPES,
  ACCEPTED_JD_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  SESSION_STORAGE_KEYS,
} from '@/lib/constants';
import { formatFileSize } from '@/lib/utils';
import { createSampleCvFile, SAMPLE_JD_VI } from '@/lib/sample-data';

export default function AnalyzePage() {
  const router = useRouter();

  // Form states
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdTab, setJdTab] = useState<'text' | 'file'>('text');
  const [jdText, setJdText] = useState<string>('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<'vi' | 'en'>('vi');
  const [saveToHistory, setSaveToHistory] = useState<boolean>(false);

  // Submission & loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);

  const loadingSteps = [
    'Đang tải lên và trích xuất văn bản từ CV...',
    'Phân tích cấu trúc và tiêu chí trong Job Description...',
    'Đối chiếu đa chiều và thẩm định bằng chứng trích dẫn...',
    'Tính toán điểm trọng số và khởi tạo đề xuất tối ưu...',
  ];

  // CV Dropzone
  const onCvDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      toast.error('Tệp CV không hợp lệ. Vui lòng chọn tệp PDF, DOCX hoặc TXT dưới 10MB.');
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Kích thước tệp CV vượt quá ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setCvFile(file);
    }
  }, []);

  const {
    getRootProps: getCvRootProps,
    getInputProps: getCvInputProps,
    isDragActive: isCvDragActive,
  } = useDropzone({
    onDrop: onCvDrop,
    accept: ACCEPTED_CV_TYPES,
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  // JD File Dropzone
  const onJdFileDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast.error('Tệp JD không hợp lệ. Vui lòng chọn tệp PDF, DOCX hoặc TXT dưới 10MB.');
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`Kích thước tệp JD vượt quá ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }
        setJdFile(file);
      }
    },
    []
  );

  const {
    getRootProps: getJdRootProps,
    getInputProps: getJdInputProps,
    isDragActive: isJdDragActive,
  } = useDropzone({
    onDrop: onJdFileDrop,
    accept: ACCEPTED_JD_TYPES,
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  // Load sample data button handler
  const handleLoadSampleData = () => {
    try {
      const sampleFile = createSampleCvFile();
      setCvFile(sampleFile);
      setJdTab('text');
      setJdText(SAMPLE_JD_VI);
      setJdFile(null);
      setOutputLanguage('vi');
      toast.success('Đã tải thành công dữ liệu CV và JD mẫu (Vị trí Senior Fullstack Developer)!');
    } catch {
      toast.error('Không thể tạo dữ liệu mẫu.');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate CV
    if (!cvFile) {
      toast.error('Vui lòng tải lên tệp CV của ứng viên (PDF, DOCX hoặc TXT).');
      return;
    }

    // 2. Validate JD
    const hasJdText = jdTab === 'text' && jdText.trim().length > 0;
    const hasJdFile = jdTab === 'file' && jdFile !== null;

    if (!hasJdText && !hasJdFile) {
      toast.error('Vui lòng cung cấp mô tả công việc (JD) bằng cách dán văn bản hoặc tải tệp lên.');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadingStepIndex(0);

      // Simulate step progress for user feedback
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => {
          if (prev < loadingSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 1800);

      const result = await analyzeCV({
        cvFile,
        jdText: jdTab === 'text' ? jdText : undefined,
        jdFile: jdTab === 'file' ? (jdFile as File) : undefined,
        outputLanguage,
        saveToHistory,
      });

      clearInterval(interval);

      // Save to sessionStorage for page persistence
      sessionStorage.setItem(SESSION_STORAGE_KEYS.LATEST_ANALYSIS, JSON.stringify(result));
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.SUGGESTION_STATES);

      toast.success('Phân tích hồ sơ hoàn tất!');
      router.push('/results');
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Phân tích hồ sơ thất bại. Vui lòng thử lại.';
      toast.error(msg);
    }
  };

  return (
    <div className="py-10 md:py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Phân tích & Đối chiếu Hồ sơ
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tải lên hồ sơ ứng viên và bản mô tả công việc để nhận báo cáo đối chiếu bằng chứng chi tiết.
          </p>
        </div>

        {/* Load sample data button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          onClick={handleLoadSampleData}
          disabled={isSubmitting}
          className="self-start sm:self-auto font-medium shadow-xs"
        >
          Tải dữ liệu mẫu
        </Button>
      </div>

      {/* Loading Overlay Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Đang xử lý phân tích hồ sơ...
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {loadingSteps[loadingStepIndex]}
              </p>
            </div>

            {/* Stepper indicators */}
            <div className="space-y-2 text-left pt-2 border-t border-slate-100 dark:border-slate-800">
              {loadingSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {idx < loadingStepIndex ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : idx === loadingStepIndex ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  )}
                  <span
                    className={
                      idx === loadingStepIndex
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : idx < loadingStepIndex
                        ? 'text-slate-500 dark:text-slate-400 line-through'
                        : 'text-slate-400'
                    }
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Quá trình này thường kéo dài từ 5 đến 15 giây tùy theo kích thước tài liệu.
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 1: CV UPLOAD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>Hồ sơ ứng viên (CV)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">PDF, DOCX, TXT (Tối đa 10MB)</span>
            </div>

            {!cvFile ? (
              <div
                {...getCvRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[260px] ${
                  isCvDragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 hover:border-blue-400 bg-white dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <input {...getCvInputProps()} aria-label="Tải lên tệp CV" />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isCvDragActive ? 'Thả tệp CV vào đây...' : 'Kéo thả CV hoặc nhấp để chọn tệp'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Hỗ trợ định dạng PDF, Microsoft Word (.docx) hoặc Plain Text (.txt).
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5 flex items-center justify-between min-h-[260px]">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Tệp CV đã sẵn sàng
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 max-w-[260px] truncate">
                      {cvFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      Dung lượng: {formatFileSize(cvFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCvFile(null)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title="Gỡ bỏ tệp này"
                  aria-label="Gỡ bỏ tệp CV"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: JD INPUT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>Mô tả công việc (JD)</span>
                <span className="text-rose-500">*</span>
              </label>

              {/* Tabs selector */}
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setJdTab('text')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    jdTab === 'text'
                      ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Dán văn bản
                </button>
                <button
                  type="button"
                  onClick={() => setJdTab('file')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    jdTab === 'file'
                      ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tải tệp JD
                </button>
              </div>
            </div>

            {/* Tab 1: Textarea */}
            {jdTab === 'text' && (
              <div className="space-y-1.5">
                <textarea
                  rows={10}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Dán toàn bộ nội dung bản mô tả công việc (trách nhiệm, yêu cầu kinh nghiệm, kỹ năng chuyên môn)..."
                  className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed min-h-[260px]"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                  <span>Khuyến nghị: Nhập tối thiểu từ 50 từ để đạt độ chuẩn xác cao nhất.</span>
                  <span>{jdText.length} ký tự</span>
                </div>
              </div>
            )}

            {/* Tab 2: JD File Upload */}
            {jdTab === 'file' && (
              <div>
                {!jdFile ? (
                  <div
                    {...getJdRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[260px] ${
                      isJdDragActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-300 hover:border-blue-400 bg-white dark:bg-slate-900 dark:border-slate-800'
                    }`}
                  >
                    <input {...getJdInputProps()} aria-label="Tải lên tệp JD" />
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isJdDragActive ? 'Thả tệp JD vào đây...' : 'Kéo thả tệp JD hoặc nhấp để chọn'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Hỗ trợ PDF, DOCX, TXT dưới 10MB.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800 p-5 flex items-center justify-between min-h-[260px]">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                          Tệp JD đã sẵn sàng
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 max-w-[260px] truncate">
                          {jdFile.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          Dung lượng: {formatFileSize(jdFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setJdFile(null)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Gỡ bỏ tệp này"
                      aria-label="Gỡ bỏ tệp JD"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: OPTIONS & PRIVACY */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Output Language Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Languages className="w-4 h-4 text-blue-600" />
                <span>Ngôn ngữ báo cáo & đề xuất</span>
              </label>
              <div className="flex items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="outputLanguage"
                    value="vi"
                    checked={outputLanguage === 'vi'}
                    onChange={() => setOutputLanguage('vi')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tiếng Việt</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="outputLanguage"
                    value="en"
                    checked={outputLanguage === 'en'}
                    onChange={() => setOutputLanguage('en')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>English</span>
                </label>
              </div>
            </div>

            {/* Save to history opt-in */}
            <div className="space-y-1 sm:max-w-md">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToHistory}
                  onChange={(e) => setSaveToHistory(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Lưu kết quả này vào lịch sử phân tích
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                    Mặc định tắt nhằm bảo vệ quyền riêng tư. Chỉ bật nếu bạn muốn xem lại kết quả này ở trang Lịch sử.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold text-base px-8 py-3.5 shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? 'Đang phân tích...' : 'Bắt đầu đối chiếu CV & JD'}
          </Button>
        </div>
      </form>
    </div>
  );
}
