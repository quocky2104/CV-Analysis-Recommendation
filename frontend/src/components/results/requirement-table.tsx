'use client';

import React, { useState, useMemo } from 'react';
import { RequirementMatch, MatchStatus, Priority } from '@/lib/types';
import { getPriorityBadgeProps, getStatusBadgeProps, cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Quote,
  Filter,
} from 'lucide-react';

interface RequirementTableProps {
  matches: RequirementMatch[];
}

export function RequirementTable({ matches }: RequirementTableProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Count items by status
  const counts = useMemo(() => {
    return {
      all: matches.length,
      match: matches.filter((m) => m.status === 'match').length,
      partial_match: matches.filter((m) => m.status === 'partial_match').length,
      not_evidenced: matches.filter((m) => m.status === 'not_evidenced').length,
    };
  }, [matches]);

  // Filtered requirements
  const filteredMatches = useMemo(() => {
    return matches.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inReq = item.requirement.toLowerCase().includes(q);
        const inReason = item.reason.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inEvidence = item.evidence?.toLowerCase().includes(q) ?? false;
        if (!inReq && !inReason && !inCategory && !inEvidence) return false;
      }
      return true;
    });
  }, [matches, statusFilter, priorityFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === filteredMatches.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredMatches.map((m) => m.requirement_id)));
    }
  };

  const renderStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'partial_match':
        return <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />;
      case 'not_evidenced':
      default:
        return <XCircle className="w-4 h-4 text-rose-700 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Bộ lọc trạng thái">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer shadow-xs',
              statusFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
            )}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('match')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer shadow-xs',
              statusFilter === 'match'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Khớp ({counts.match})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partial_match')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer shadow-xs',
              statusFilter === 'partial_match'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Một phần ({counts.partial_match})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('not_evidenced')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer shadow-xs',
              statusFilter === 'not_evidenced'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-50'
            )}
          >
            <XCircle className="w-4 h-4" />
            <span>Chưa thấy ({counts.not_evidenced})</span>
          </button>
        </div>

        {/* Priority Filter and Search */}
        <div className="flex items-center gap-2">
          {/* Priority Select */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | Priority)}
              className="text-xs font-bold py-2 pl-3 pr-8 rounded-lg border-2 border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
              aria-label="Lọc theo độ ưu tiên"
            >
              <option value="all">Mọi độ ưu tiên</option>
              <option value="required">Bắt buộc</option>
              <option value="preferred">Ưu tiên</option>
              <option value="nice_to_have">Điểm cộng</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm yêu cầu..."
              className="w-full text-xs font-medium py-2 pl-8 pr-3 rounded-lg border-2 border-slate-300 bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          {/* Expand/Collapse All */}
          <button
            type="button"
            onClick={toggleExpandAll}
            className="text-xs font-bold px-3 py-2 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 cursor-pointer whitespace-nowrap shadow-xs"
            title="Mở hoặc đóng tất cả"
          >
            {expandedIds.size === filteredMatches.length && filteredMatches.length > 0
              ? 'Thu gọn'
              : 'Mở tất cả'}
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-slate-600">#</th>
                <th className="py-3.5 px-4">Yêu cầu từ JD</th>
                <th className="py-3.5 px-4 w-32">Độ ưu tiên</th>
                <th className="py-3.5 px-4 w-40">Trạng thái</th>
                <th className="py-3.5 px-4 w-32 hidden sm:table-cell">Danh mục</th>
                <th className="py-3.5 px-4 w-14 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-600 font-medium">
                    <Filter className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                    Không tìm thấy yêu cầu nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((item, index) => {
                  const isExpanded = expandedIds.has(item.requirement_id);
                  const priorityBadge = getPriorityBadgeProps(item.priority);
                  const statusBadge = getStatusBadgeProps(item.status);

                  return (
                    <React.Fragment key={item.requirement_id}>
                      <tr
                        onClick={() => toggleExpand(item.requirement_id)}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer transition-colors',
                          isExpanded && 'bg-blue-50/50'
                        )}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpand(item.requirement_id);
                          }
                        }}
                        aria-expanded={isExpanded}
                      >
                        <td className="py-4 px-4 text-xs font-mono font-bold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-950">
                          <div className="flex flex-col">
                            <span>{item.requirement}</span>
                            <span className="sm:hidden text-xs text-slate-600 mt-0.5 font-medium">
                              {item.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-xs',
                              priorityBadge.className
                            )}
                          >
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-xs',
                              statusBadge.className
                            )}
                          >
                            {renderStatusIcon(item.status)}
                            <span>{statusBadge.label}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-700 hidden sm:table-cell">
                          {item.category}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700"
                            aria-label={isExpanded ? 'Thu gọn' : 'Xem bằng chứng'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded row with verified evidence and reasoning */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-slate-200">
                          <td colSpan={6} className="py-4 px-6 pb-5">
                            <div className="pl-4 sm:pl-8 border-l-4 border-blue-600 space-y-3">
                              {/* Reason explanation */}
                              <div>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                  Đánh giá chi tiết:
                                </span>
                                <p className="text-sm text-slate-800 mt-1 leading-relaxed font-medium">
                                  {item.reason}
                                </p>
                              </div>

                              {/* Evidence section */}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    Bằng chứng trích xuất từ CV:
                                  </span>
                                  {item.evidence_section && (
                                    <span className="text-xs bg-slate-200 border border-slate-300 px-2 py-0.5 rounded text-slate-800 font-mono font-bold">
                                      Mục: {item.evidence_section}
                                    </span>
                                  )}
                                  {item.is_verified_quote && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                                      <Quote className="w-3.5 h-3.5 text-emerald-700" /> Trích dẫn nguyên văn
                                    </span>
                                  )}
                                </div>

                                {item.evidence ? (
                                  <blockquote className="mt-2 p-3.5 rounded-xl bg-white border-2 border-slate-200 text-sm text-slate-900 italic font-serif leading-relaxed shadow-xs">
                                    &ldquo;{item.evidence}&rdquo;
                                  </blockquote>
                                ) : (
                                  <p className="mt-1.5 text-xs text-rose-800 font-bold italic">
                                    Chưa tìm thấy bằng chứng hoặc từ khóa tương đương trong hồ sơ ứng viên.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
