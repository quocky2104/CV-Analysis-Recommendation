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
      text: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      fill: '#059669', // emerald-600
      level: 'high',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      fill: '#d97706', // amber-600
      level: 'medium',
    };
  }
  return {
    text: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    fill: '#dc2626', // rose-600
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
        className: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
      };
    case 'partial_match':
      return {
        label: 'Khớp một phần',
        symbol: '~',
        className: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      };
    case 'not_evidenced':
    default:
      return {
        label: 'Chưa có bằng chứng',
        symbol: '✕',
        className: 'bg-rose-50 text-rose-900 border-rose-300 font-bold',
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
        className: 'bg-rose-50 text-rose-900 border-rose-300 font-bold',
      };
    case 'preferred':
      return {
        label: 'Ưu tiên',
        className: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      };
    case 'nice_to_have':
    default:
      return {
        label: 'Điểm cộng',
        className: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
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
