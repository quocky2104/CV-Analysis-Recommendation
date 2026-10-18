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
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'partial_match':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'not_evidenced':
      default:
        return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
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
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer',
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            )}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('match')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer',
              statusFilter === 'match'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-900'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Khớp ({counts.match})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partial_match')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer',
              statusFilter === 'partial_match'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-900'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Một phần ({counts.partial_match})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('not_evidenced')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer',
              statusFilter === 'not_evidenced'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900'
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
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
              className="text-xs py-1.5 pl-2.5 pr-8 rounded-lg border border-slate-200 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Lọc theo độ ưu tiên"
            >
              <option value="all">Mọi độ ưu tiên</option>
              <option value="required">Bắt buộc</option>
              <option value="preferred">Ưu tiên</option>
              <option value="nice_to_have">Điểm cộng</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm yêu cầu..."
              className="w-full text-xs py-1.5 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expand/Collapse All */}
          <button
            type="button"
            onClick={toggleExpandAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap"
            title="Mở hoặc đóng tất cả"
          >
            {expandedIds.size === filteredMatches.length && filteredMatches.length > 0
              ? 'Thu gọn'
              : 'Mở tất cả'}
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Yêu cầu từ JD</th>
                <th className="py-3 px-4 w-28">Độ ưu tiên</th>
                <th className="py-3 px-4 w-36">Trạng thái</th>
                <th className="py-3 px-4 w-28 hidden sm:table-cell">Danh mục</th>
                <th className="py-3 px-4 w-12 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <Filter className="w-6 h-6 mx-auto mb-2 text-slate-300" />
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
                          'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                          isExpanded && 'bg-blue-50/30 dark:bg-blue-950/20'
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
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex flex-col">
                            <span>{item.requirement}</span>
                            <span className="sm:hidden text-xs text-slate-400 mt-0.5">
                              {item.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 text-xs font-semibold rounded-full border',
                              priorityBadge.className
                            )}
                          >
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border',
                              statusBadge.className
                            )}
                          >
                            {renderStatusIcon(item.status)}
                            <span>{statusBadge.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {item.category}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            aria-label={isExpanded ? 'Thu gọn' : 'Xem bằng chứng'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded row with verified evidence and reasoning */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                          <td colSpan={6} className="py-3 px-6 pb-4">
                            <div className="pl-4 sm:pl-8 border-l-2 border-blue-500 space-y-2.5">
                              {/* Reason explanation */}
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  Đánh giá chi tiết:
                                </span>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                                  {item.reason}
                                </p>
                              </div>

                              {/* Evidence section */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Bằng chứng trích xuất từ CV:
                                  </span>
                                  {item.evidence_section && (
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                                      Mục: {item.evidence_section}
                                    </span>
                                  )}
                                  {item.is_verified_quote && (
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                                      <Quote className="w-3 h-3" /> Trích dẫn nguyên văn
                                    </span>
                                  )}
                                </div>

                                {item.evidence ? (
                                  <blockquote className="mt-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 italic font-serif">
                                    &ldquo;{item.evidence}&rdquo;
                                  </blockquote>
                                ) : (
                                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 italic">
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
