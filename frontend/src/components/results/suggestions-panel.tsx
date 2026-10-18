'use client';

import React, { useState } from 'react';
import { RevisionSuggestion, SuggestionStatus, UserSuggestionState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Edit3,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionsPanelProps {
  suggestions: RevisionSuggestion[];
  suggestionStates: Record<string, UserSuggestionState>;
  onUpdateState: (id: string, state: UserSuggestionState) => void;
}

export function SuggestionsPanel({
  suggestions,
  suggestionStates,
  onUpdateState,
}: SuggestionsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');

  const acceptedCount = Object.values(suggestionStates).filter(
    (s) => s.status === 'accepted' || s.status === 'edited'
  ).length;

  const handleStartEdit = (item: RevisionSuggestion) => {
    setEditingId(item.id);
    const currentState = suggestionStates[item.id];
    setDraftText(currentState?.editedText || item.proposed_text);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateState(id, {
      status: 'edited',
      editedText: draftText,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftText('');
  };

  const handleAccept = (id: string) => {
    onUpdateState(id, {
      status: 'accepted',
    });
  };

  const handleReject = (id: string) => {
    onUpdateState(id, {
      status: 'rejected',
    });
  };

  const handleReset = (id: string) => {
    onUpdateState(id, {
      status: 'pending',
    });
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p>Hồ sơ của bạn đã đáp ứng rất tốt hoặc không có đề xuất chỉnh sửa cần thiết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-blue-50/70 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-950 dark:text-blue-100">
              Đề xuất tối ưu hóa CV cho vị trí ứng tuyển
            </h4>
            <p className="text-xs text-blue-700/80 dark:text-blue-300">
              Chấp nhận các đề xuất phù hợp để tạo file CV DOCX tùy chỉnh đã được cập nhật.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white shadow-xs">
            Đã chấp nhận: {acceptedCount}/{suggestions.length}
          </span>
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-3.5">
        {suggestions.map((item, index) => {
          const state = suggestionStates[item.id] || { status: 'pending' };
          const isAccepted = state.status === 'accepted';
          const isEdited = state.status === 'edited';
          const isRejected = state.status === 'rejected';
          const isEditing = editingId === item.id;

          const displayText = state.editedText || item.proposed_text;

          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900',
                isAccepted && 'border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/20',
                isEdited && 'border-blue-300 dark:border-blue-800 ring-1 ring-blue-400/20',
                isRejected && 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50',
                state.status === 'pending' && 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              )}
            >
              {/* Card top banner */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold">#{index + 1}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {item.section}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.2 rounded-full font-medium',
                      item.priority === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    Ưu tiên: {item.priority === 'high' ? 'Cao' : item.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>

                {/* Status indicator */}
                <div>
                  {isAccepted && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấp nhận
                    </span>
                  )}
                  {isEdited && (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chỉnh sửa & duyệt
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                      <X className="w-3.5 h-3.5" /> Đã bỏ qua
                    </span>
                  )}
                  {state.status === 'pending' && (
                    <span className="text-slate-400 font-medium">Chờ xem xét</span>
                  )}
                </div>
              </div>

              {/* Card content */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* User input warning */}
                {item.needs_user_input && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cần dữ liệu thực tế:</strong> Hãy chỉnh sửa để thay thế các số liệu/chỉ số cụ thể phù hợp với trải nghiệm của bạn trước khi duyệt.
                    </span>
                  </div>
                )}

                {/* Original text vs Proposed text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {item.original_text && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Văn bản hiện tại:
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {item.original_text}
                      </p>
                    </div>
                  )}

                  <div
                    className={cn(
                      'p-3 rounded-lg border',
                      !item.original_text && 'md:col-span-2',
                      isEditing
                        ? 'bg-white border-blue-400 ring-2 ring-blue-100 dark:bg-slate-900'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Đề xuất mới:
                      </span>
                      {isEdited && !isEditing && (
                        <span className="text-[10px] text-blue-600 italic">Đã tùy biến</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          className="w-full text-xs font-mono p-2 border rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Chỉnh sửa văn bản đề xuất..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                            onClick={() => handleSaveEdit(item.id)}
                          >
                            Lưu & Chấp nhận
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-mono whitespace-pre-wrap">
                        {displayText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                    Mục đích cải thiện:{' '}
                  </strong>
                  <span>{item.reason}</span>
                </div>

                {/* Action buttons */}
                {!isEditing && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {state.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleReset(item.id)}
                      >
                        Đặt lại
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleStartEdit(item)}
                    >
                      Chỉnh sửa
                    </Button>

                    <Button
                      size="sm"
                      variant={isRejected ? 'secondary' : 'outline'}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={() => handleReject(item.id)}
                      className={cn(isRejected && 'text-rose-600 border-rose-200')}
                    >
                      Bỏ qua
                    </Button>

                    <Button
                      size="sm"
                      variant={isAccepted ? 'secondary' : 'primary'}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleAccept(item.id)}
                      className={cn(isAccepted && 'bg-emerald-600 text-white hover:bg-emerald-700')}
                    >
                      {isAccepted ? 'Đã duyệt' : 'Chấp nhận đề xuất'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
