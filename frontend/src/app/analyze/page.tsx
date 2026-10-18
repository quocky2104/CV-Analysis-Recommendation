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
  ArrowRight,
  Layers,
  CheckCircle,
  FileUp,
  FileCheck,
  Languages,
  Shield,
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

  // Load sample dataset
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Phân tích &amp; Đối chiếu Hồ sơ
          </h1>
          <p className="text-sm text-slate-700 font-medium mt-1.5">
            Tải lên hồ sơ ứng viên và bản mô tả công việc để nhận báo cáo đối chiếu bằng chứng chi tiết.
          </p>
        </div>

        {/* Load sample data button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="w-4 h-4 text-blue-700" />}
          onClick={handleLoadSampleData}
          disabled={isSubmitting}
          className="self-start sm:self-auto font-bold border-2 border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs"
        >
          Tải dữ liệu mẫu
        </Button>
      </div>

      {/* Loading Overlay Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200">
              <Layers className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-950">
                Đang xử lý phân tích hồ sơ...
              </h3>
              <p className="text-sm text-blue-700 font-bold">
                {loadingSteps[loadingStepIndex]}
              </p>
            </div>

            {/* Stepper indicators */}
            <div className="space-y-2 text-left pt-2 border-t border-slate-200">
              {loadingSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {idx < loadingStepIndex ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : idx === loadingStepIndex ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <span
                    className={
                      idx === loadingStepIndex
                        ? 'font-bold text-slate-950'
                        : idx < loadingStepIndex
                        ? 'text-slate-500 line-through'
                        : 'text-slate-500 font-medium'
                    }
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic font-medium">
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
              <label className="text-sm font-black text-slate-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Hồ sơ ứng viên (CV)</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs text-slate-600 font-semibold">PDF, DOCX, TXT (Tối đa 10MB)</span>
            </div>

            {!cvFile ? (
              <div
                {...getCvRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[280px] bg-white ${
                  isCvDragActive
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <input {...getCvInputProps()} aria-label="Tải lên tệp CV" />
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center mb-4 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-slate-900">
                  {isCvDragActive ? 'Thả tệp CV vào đây...' : 'Kéo thả CV hoặc nhấp để chọn tệp'}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1.5 max-w-xs">
                  Hỗ trợ định dạng PDF, Microsoft Word (.docx) hoặc Plain Text (.txt).
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-5 flex items-center justify-between min-h-[280px] shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      Tệp CV đã sẵn sàng
                    </span>
                    <h4 className="text-base font-bold text-slate-950 mt-1 max-w-[260px] truncate">
                      {cvFile.name}
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 font-mono font-semibold">
                      Dung lượng: {formatFileSize(cvFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCvFile(null)}
                  className="p-2.5 text-slate-500 hover:text-rose-700 rounded-xl hover:bg-rose-100 transition-colors"
                  title="Gỡ bỏ tệp này"
                  aria-label="Gỡ bỏ tệp CV"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: JD INPUT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Mô tả công việc (JD)</span>
                <span className="text-rose-600">*</span>
              </label>

              {/* Tabs selector */}
              <div className="flex rounded-lg border-2 border-slate-200 p-0.5 bg-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setJdTab('text')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    jdTab === 'text'
                      ? 'bg-white text-blue-700 shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Dán văn bản
                </button>
                <button
                  type="button"
                  onClick={() => setJdTab('file')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    jdTab === 'file'
                      ? 'bg-white text-blue-700 shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-950'
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
                  className="w-full text-sm p-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-sans leading-relaxed min-h-[280px] shadow-xs"
                />
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium px-1">
                  <span>Khuyến nghị: Nhập tối thiểu từ 50 từ để đạt độ chuẩn xác cao nhất.</span>
                  <span className="font-mono font-bold text-slate-700">{jdText.length} ký tự</span>
                </div>
              </div>
            )}

            {/* Tab 2: JD File Upload */}
            {jdTab === 'file' && (
              <div>
                {!jdFile ? (
                  <div
                    {...getJdRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[280px] bg-white ${
                      isJdDragActive
                        ? 'border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <input {...getJdInputProps()} aria-label="Tải lên tệp JD" />
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center mb-4 shadow-xs">
                      <FileUp className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-slate-900">
                      {isJdDragActive ? 'Thả tệp JD vào đây...' : 'Kéo thả tệp JD hoặc nhấp để chọn'}
                    </p>
                    <p className="text-xs text-slate-600 font-medium mt-1.5 max-w-xs">
                      Hỗ trợ PDF, DOCX, TXT dưới 10MB.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/60 p-5 flex items-center justify-between min-h-[280px] shadow-xs">
                    <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center justify-center shrink-0">
                    <FileCheck className="w-7 h-7" />
                  </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-800">
                          Tệp JD đã sẵn sàng
                        </span>
                        <h4 className="text-base font-bold text-slate-950 mt-1 max-w-[260px] truncate">
                          {jdFile.name}
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 font-mono font-semibold">
                          Dung lượng: {formatFileSize(jdFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setJdFile(null)}
                      className="p-2.5 text-slate-500 hover:text-rose-700 rounded-xl hover:bg-rose-100 transition-colors"
                      title="Gỡ bỏ tệp này"
                      aria-label="Gỡ bỏ tệp JD"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: OPTIONS & PRIVACY */}
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Output Language Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Languages className="w-4 h-4 text-blue-700" />
                <span>Ngôn ngữ báo cáo &amp; đề xuất</span>
              </label>
              <div className="flex items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="outputLanguage"
                    value="vi"
                    checked={outputLanguage === 'vi'}
                    onChange={() => setOutputLanguage('vi')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Tiếng Việt</span>
                </label>
                <label className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="outputLanguage"
                    value="en"
                    checked={outputLanguage === 'en'}
                    onChange={() => setOutputLanguage('en')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>English</span>
                </label>
              </div>
            </div>

            {/* Save to history opt-in */}
            <div className="space-y-1 md:max-w-md pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToHistory}
                  onChange={(e) => setSaveToHistory(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-950 text-sm">
                    Lưu kết quả này vào lịch sử phân tích
                  </span>
                  <p className="text-slate-600 font-medium mt-1 text-xs leading-relaxed">
                    Mặc định tắt nhằm bảo vệ quyền riêng tư. Chỉ bật nếu bạn muốn lưu trữ kết quả này để xem lại ở trang Lịch sử.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto font-black text-base px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/25 transition-all"
          >
            {isSubmitting ? 'Đang phân tích...' : 'Bắt đầu đối chiếu CV & JD'}
          </Button>
        </div>
      </form>
    </div>
  );
}
