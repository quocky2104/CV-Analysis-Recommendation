'use client';

import React, { useState } from 'react';
import { RevisionSuggestion, UserSuggestionState } from '@/lib/types';
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
      <div className="p-8 text-center bg-white rounded-2xl border-2 border-slate-200 text-slate-700 shadow-sm">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-600" />
        <p className="font-semibold text-sm">Hồ sơ của bạn đã đáp ứng rất tốt hoặc không có đề xuất chỉnh sửa cần thiết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="text-base font-black text-blue-950">
              Đề xuất tối ưu hóa CV cho vị trí ứng tuyển
            </h4>
            <p className="text-xs text-blue-800 font-medium mt-0.5">
              Chấp nhận các đề xuất phù hợp để tạo file CV DOCX tùy chỉnh đã được cập nhật.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-700 text-white shadow-xs">
            Đã chấp nhận: {acceptedCount}/{suggestions.length}
          </span>
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-4">
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
                'rounded-2xl border-2 transition-all duration-200 overflow-hidden bg-white shadow-xs',
                isAccepted && 'border-emerald-500 ring-2 ring-emerald-200',
                isEdited && 'border-blue-500 ring-2 ring-blue-200',
                isRejected && 'opacity-65 border-slate-300 bg-slate-50',
                state.status === 'pending' && 'border-slate-300 hover:border-blue-400'
              )}
            >
              {/* Card top banner */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-100 border-b-2 border-slate-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-600 font-black">#{index + 1}</span>
                  <span className="font-black text-slate-950 uppercase tracking-wider">
                    {item.section}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-bold border shadow-xs',
                      item.priority === 'high'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-slate-200 text-slate-800 border-slate-300'
                    )}
                  >
                    Ưu tiên: {item.priority === 'high' ? 'Cao' : item.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>

                {/* Status indicator */}
                <div>
                  {isAccepted && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-black bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Đã chấp nhận
                    </span>
                  )}
                  {isEdited && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-black bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" /> Đã chỉnh sửa &amp; duyệt
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded-full">
                      <X className="w-4 h-4 text-slate-500" /> Đã bỏ qua
                    </span>
                  )}
                  {state.status === 'pending' && (
                    <span className="text-xs text-slate-600 font-bold">Chờ xem xét</span>
                  )}
                </div>
              </div>

              {/* Card content */}
              <div className="p-5 space-y-4">
                {/* User input warning */}
                {item.needs_user_input && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-black text-amber-950">Cần dữ liệu thực tế:</strong> Hãy chỉnh sửa để thay thế các số liệu/chỉ số cụ thể phù hợp với trải nghiệm của bạn trước khi duyệt.
                    </span>
                  </div>
                )}

                {/* Original text vs Proposed text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.original_text && (
                    <div className="p-4 rounded-xl bg-slate-100 border-2 border-slate-200">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                        Văn bản hiện tại:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-mono font-medium whitespace-pre-wrap">
                        {item.original_text}
                      </p>
                    </div>
                  )}

                  <div
                    className={cn(
                      'p-4 rounded-xl border-2',
                      !item.original_text && 'md:col-span-2',
                      isEditing
                        ? 'bg-white border-blue-600 ring-4 ring-blue-100'
                        : 'bg-emerald-50/70 border-emerald-300'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                        Đề xuất mới:
                      </span>
                      {isEdited && !isEditing && (
                        <span className="text-xs text-blue-700 font-bold italic">Đã tùy biến</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          rows={4}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          className="w-full text-xs font-mono font-medium p-3 border-2 rounded-xl border-slate-300 bg-white text-slate-950 focus:outline-none focus:border-blue-600"
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
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          >
                            Lưu &amp; Chấp nhận
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-950 font-bold leading-relaxed font-mono whitespace-pre-wrap">
                        {displayText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="text-xs text-slate-700 font-medium">
                  <strong className="text-slate-900 font-bold">
                    Mục đích cải thiện:{' '}
                  </strong>
                  <span>{item.reason}</span>
                </div>

                {/* Action buttons */}
                {!isEditing && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    {state.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleReset(item.id)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Đặt lại
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleStartEdit(item)}
                      className="border-2 border-slate-300 text-slate-800 font-bold"
                    >
                      Chỉnh sửa
                    </Button>

                    <Button
                      size="sm"
                      variant={isRejected ? 'secondary' : 'outline'}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={() => handleReject(item.id)}
                      className={cn(isRejected ? 'bg-slate-200 text-slate-800 border-slate-300' : 'border-2 border-slate-300 text-slate-700')}
                    >
                      Bỏ qua
                    </Button>

                    <Button
                      size="sm"
                      variant={isAccepted ? 'secondary' : 'primary'}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleAccept(item.id)}
                      className={cn(
                        isAccepted
                          ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300 font-bold'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold'
                      )}
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
