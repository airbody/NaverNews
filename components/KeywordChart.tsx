'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Tag } from 'lucide-react';
import type { KeywordItem } from '@/lib/types';

interface KeywordChartProps {
  keywords: KeywordItem[];
  onKeywordClick?: (keyword: string) => void;
}

interface TooltipPayload {
  payload?: KeywordItem & { importance: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as KeywordItem;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm max-w-xs"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        {item.keyword}
      </p>
      <p style={{ color: 'var(--text-secondary)' }}>{item.reason}</p>
    </div>
  );
}

export default function KeywordChart({ keywords, onKeywordClick }: KeywordChartProps) {
  const sorted = [...keywords].sort((a, b) => b.importance - a.importance);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Tag size={17} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          핵심 키워드
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="keyword"
            width={90}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {sorted.map((entry, i) => (
              <Cell
                key={entry.keyword}
                fill={`hsl(${210 + i * 15}, 80%, ${60 - i * 4}%)`}
                cursor={onKeywordClick ? 'pointer' : 'default'}
                onClick={() => onKeywordClick?.(entry.keyword)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {onKeywordClick && (
        <p className="mt-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          키워드를 클릭하면 재검색합니다
        </p>
      )}
    </div>
  );
}
