'use client';

import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getScoreColor } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  totalRequirements: number;
  matchedCount: number;
  partialCount: number;
  notEvidencedCount: number;
}

export function ScoreDisplay({
  score,
  totalRequirements,
  matchedCount,
  partialCount,
  notEvidencedCount,
}: ScoreDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorInfo = getScoreColor(score);

  const data = [
    {
      name: 'Score',
      value: score,
      fill: colorInfo.fill,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Điểm khớp tổng thể
      </h3>

      {/* Radial chart container with center score */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="72%"
              outerRadius="100%"
              barSize={14}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: '#e2e8f0' }}
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full rounded-full border-12 border-slate-200 animate-pulse" />
        )}

        {/* Center score overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: colorInfo.fill }}>
            {score}%
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {score >= 70 ? 'Phù hợp cao' : score >= 40 ? 'Phù hợp vừa' : 'Cần bổ sung'}
          </span>
        </div>
      </div>

      {/* Quick summary metrics */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Khớp</span>
          </div>
          <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
            {matchedCount}/{totalRequirements}
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Một phần</span>
          </div>
          <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
            {partialCount}/{totalRequirements}
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Chưa thấy</span>
          </div>
          <span className="text-lg font-bold text-rose-800 dark:text-rose-200">
            {notEvidencedCount}/{totalRequirements}
          </span>
        </div>
      </div>
    </div>
  );
}
