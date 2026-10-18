import { MatchStatus, Priority } from './types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_CV_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt', '.md'],
};

export const ACCEPTED_JD_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt', '.md'],
};

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    labelVi: string;
    labelEn: string;
    weight: number;
    badgeVariant: 'danger' | 'warning' | 'info';
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  required: {
    labelVi: 'Bắt buộc',
    labelEn: 'Required',
    weight: 3,
    badgeVariant: 'danger',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
  },
  preferred: {
    labelVi: 'Ưu tiên',
    labelEn: 'Preferred',
    weight: 2,
    badgeVariant: 'warning',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  nice_to_have: {
    labelVi: 'Điểm cộng',
    labelEn: 'Nice to have',
    weight: 1,
    badgeVariant: 'info',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    textClass: 'text-sky-700 dark:text-sky-300',
    borderClass: 'border-sky-200 dark:border-sky-800',
  },
};

export const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  {
    labelVi: string;
    labelEn: string;
    scoreWeight: number;
    badgeVariant: 'success' | 'warning' | 'danger';
    symbol: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  match: {
    labelVi: 'Khớp hoàn toàn',
    labelEn: 'Matched',
    scoreWeight: 1.0,
    badgeVariant: 'success',
    symbol: '✓',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  partial_match: {
    labelVi: 'Khớp một phần',
    labelEn: 'Partial Match',
    scoreWeight: 0.5,
    badgeVariant: 'warning',
    symbol: '~',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  not_evidenced: {
    labelVi: 'Chưa có bằng chứng',
    labelEn: 'Not Evidenced',
    scoreWeight: 0.0,
    badgeVariant: 'danger',
    symbol: '✕',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
  },
};

export const SESSION_STORAGE_KEYS = {
  LATEST_ANALYSIS: 'cvision_latest_analysis',
  SUGGESTION_STATES: 'cvision_suggestion_states',
};
