import { clsx, type ClassValue } from 'clsx';
import { MatchStatus, Priority } from './types';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(dateString?: string | null, locale: string = 'vi-VN'): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) return '0%';
  return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  fill: string;
  level: 'high' | 'medium' | 'low';
} {
  if (score >= 70) {
    return {
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-300 dark:border-emerald-800',
      fill: '#10b981', // emerald-500
      level: 'high',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-800',
      fill: '#f59e0b', // amber-500
      level: 'medium',
    };
  }
  return {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-300 dark:border-rose-800',
    fill: '#ef4444', // rose-500
    level: 'low',
  };
}

export function getStatusBadgeProps(status: MatchStatus): {
  label: string;
  symbol: string;
  className: string;
} {
  switch (status) {
    case 'match':
      return {
        label: 'Khớp hoàn toàn',
        symbol: '✓',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'partial_match':
      return {
        label: 'Khớp một phần',
        symbol: '~',
        className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      };
    case 'not_evidenced':
    default:
      return {
        label: 'Chưa có bằng chứng',
        symbol: '✕',
        className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      };
  }
}

export function getPriorityBadgeProps(priority: Priority): {
  label: string;
  className: string;
} {
  switch (priority) {
    case 'required':
      return {
        label: 'Bắt buộc',
        className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      };
    case 'preferred':
      return {
        label: 'Ưu tiên',
        className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      };
    case 'nice_to_have':
    default:
      return {
        label: 'Điểm cộng',
        className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      };
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
