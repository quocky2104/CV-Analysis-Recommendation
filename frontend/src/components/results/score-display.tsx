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
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
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
          <span className="text-xs font-bold text-slate-700 mt-1">
            {score >= 70 ? 'Phù hợp cao' : score >= 40 ? 'Phù hợp vừa' : 'Cần bổ sung'}
          </span>
        </div>
      </div>

      {/* Quick summary metrics */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-200 text-center">
        <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
          <div className="flex items-center gap-1 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Khớp</span>
          </div>
          <span className="text-base font-black text-emerald-950 mt-0.5">
            {matchedCount}/{totalRequirements}
          </span>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50 border border-amber-300">
          <div className="flex items-center gap-1 text-xs text-amber-800 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Một phần</span>
          </div>
          <span className="text-base font-black text-amber-950 mt-0.5">
            {partialCount}/{totalRequirements}
          </span>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-xl bg-rose-50 border border-rose-300">
          <div className="flex items-center gap-1 text-xs text-rose-800 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Chưa thấy</span>
          </div>
          <span className="text-base font-black text-rose-950 mt-0.5">
            {notEvidencedCount}/{totalRequirements}
          </span>
        </div>
      </div>
    </div>
  );
}
