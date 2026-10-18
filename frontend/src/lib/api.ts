import { API_BASE_URL } from './constants';
import {
  AnalysisResponse,
  AnalysisSummary,
  CVExportRequest,
  CVProfile,
  HealthResponse,
  ReportExportRequest,
  RevisionSuggestion,
} from './types';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `Lỗi hệ thống (${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorDetail = data.detail.map((err: { msg?: string }) => err.msg || JSON.stringify(err)).join(', ');
        }
      }
    } catch {
      // If response body is not JSON, use status text
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  return handleResponse<HealthResponse>(response);
}

export interface AnalyzeParams {
  cvFile: File;
  jdText?: string;
  jdFile?: File;
  outputLanguage?: 'vi' | 'en';
  saveToHistory?: boolean;
}

export async function analyzeCV(params: AnalyzeParams): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('cv_file', params.cvFile);

  if (params.jdFile) {
    formData.append('jd_file', params.jdFile);
  } else if (params.jdText && params.jdText.trim()) {
    formData.append('jd_text', params.jdText.trim());
  } else {
    throw new Error('Vui lòng cung cấp mô tả công việc (JD) dạng văn bản hoặc tập tin.');
  }

  formData.append('output_language', params.outputLanguage || 'vi');
  formData.append('save_to_history', String(params.saveToHistory ?? false));

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<AnalysisResponse>(response);
}

export async function getHistoryList(skip: number = 0, limit: number = 50): Promise<AnalysisSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history?skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  return handleResponse<AnalysisSummary[]>(response);
}

export async function getHistoryDetail(analysisId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/${encodeURIComponent(analysisId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  return handleResponse<AnalysisResponse>(response);
}

export async function deleteHistoryItem(analysisId: string): Promise<{ message: string; id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/${encodeURIComponent(analysisId)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<{ message: string; id: string }>(response);
}

export async function exportReportPdf(analysisData: AnalysisResponse): Promise<Blob> {
  const payload: ReportExportRequest = {
    analysis_data: analysisData,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/exports/report.pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Không thể xuất PDF (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) errorDetail = err.detail;
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.blob();
}

export async function exportCvDocx(
  cvProfile: CVProfile,
  approvedSuggestionIds: string[],
  suggestions: RevisionSuggestion[]
): Promise<Blob> {
  const payload: CVExportRequest = {
    cv_profile: cvProfile,
    approved_suggestion_ids: approvedSuggestionIds,
    suggestions: suggestions,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/exports/cv.docx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Không thể xuất CV DOCX (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) errorDetail = err.detail;
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.blob();
}
