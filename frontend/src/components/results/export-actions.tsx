'use client';

import React, { useState } from 'react';
import { AnalysisResponse, UserSuggestionState } from '@/lib/types';
import { exportReportPdf, exportCvDocx } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportActionsProps {
  analysisData: AnalysisResponse;
  suggestionStates: Record<string, UserSuggestionState>;
}

export function ExportActions({ analysisData, suggestionStates }: ExportActionsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Filter approved suggestions (status === 'accepted' || status === 'edited')
  const approvedIds = Object.keys(suggestionStates).filter((id) => {
    const s = suggestionStates[id];
    return s.status === 'accepted' || s.status === 'edited';
  });

  const canExportCv = approvedIds.length > 0;

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const blob = await exportReportPdf(analysisData);
      const jobSlug = analysisData.job_title
        ? analysisData.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : 'cvision';
      const filename = `CVision_Report_${jobSlug}_${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadBlob(blob, filename);
      toast.success('Đã tải xuống báo cáo phân tích PDF thành công!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi xuất file PDF';
      toast.error(`Xuất báo cáo PDF thất bại: ${msg}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!canExportCv) {
      toast.error('Vui lòng chấp nhận ít nhất một đề xuất chỉnh sửa để tạo CV tùy chỉnh.');
      return;
    }

    try {
      setIsExportingDocx(true);

      // Prepare updated suggestions array with any edited text
      const tailoredSuggestions = analysisData.suggestions.map((item) => {
        const state = suggestionStates[item.id];
        if (state?.status === 'edited' && state.editedText) {
          return {
            ...item,
            proposed_text: state.editedText,
          };
        }
        return item;
      });

      const blob = await exportCvDocx(
        analysisData.cv_profile,
        approvedIds,
        tailoredSuggestions
      );

      const candidateSlug = analysisData.cv_profile?.name
        ? analysisData.cv_profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : 'candidate';
      const filename = `CV_${candidateSlug}_tailored_${new Date().toISOString().slice(0, 10)}.docx`;
      downloadBlob(blob, filename);
      toast.success('Đã tải xuống CV tối ưu DOCX thành công!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi xuất CV DOCX';
      toast.error(`Xuất CV DOCX thất bại: ${msg}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Export PDF Button */}
      <Button
        variant="outline"
        size="md"
        isLoading={isExportingPdf}
        leftIcon={<FileText className="w-4 h-4 text-rose-600" />}
        onClick={handleExportPdf}
        className="w-full sm:w-auto font-semibold"
      >
        Xuất Báo Cáo PDF
      </Button>

      {/* Export CV DOCX Button */}
      <div className="relative group w-full sm:w-auto">
        <Button
          variant="primary"
          size="md"
          disabled={!canExportCv || isExportingDocx}
          isLoading={isExportingDocx}
          leftIcon={<Download className="w-4 h-4" />}
          rightIcon={canExportCv ? <CheckCheck className="w-3.5 h-3.5" /> : undefined}
          onClick={handleExportDocx}
          className="w-full sm:w-auto font-semibold"
        >
          Xuất CV Tối Ưu (.DOCX)
        </Button>

        {!canExportCv && (
          <div className="hidden group-hover:flex absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 text-xs rounded-lg bg-slate-900 text-white shadow-lg z-50 items-center gap-1.5 pointer-events-none">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Chấp nhận ít nhất 1 đề xuất ở mục bên dưới để kích hoạt xuất CV</span>
          </div>
        )}
      </div>
    </div>
  );
}
