'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { SentimentResult } from '@/lib/types';

interface SentimentChartProps {
  sentiment: SentimentResult;
}

const COLORS = {
  positive: 'var(--positive)',
  neutral: 'var(--neutral)',
  negative: 'var(--negative)',
};

const LABELS = {
  positive: '긍정',
  neutral: '중립',
  negative: '부정',
};

function toneColor(tone: string): string {
  if (tone === '긍정적') return 'var(--positive)';
  if (tone === '부정적') return 'var(--negative)';
  return 'var(--accent)';
}

export default function SentimentChart({ sentiment }: SentimentChartProps) {
  const data = [
    { name: '긍정', value: sentiment.positive, key: 'positive' },
    { name: '중립', value: sentiment.neutral, key: 'neutral' },
    { name: '부정', value: sentiment.negative, key: 'negative' },
  ].filter((d) => d.value > 0);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={17} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          감정 분석
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div style={{ width: 130, height: 130, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={COLORS[entry.key as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`]}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + tone */}
        <div className="flex-1">
          {/* Overall tone badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{
              background: `color-mix(in srgb, ${toneColor(sentiment.overallTone)} 15%, transparent)`,
              color: toneColor(sentiment.overallTone),
              border: `1px solid color-mix(in srgb, ${toneColor(sentiment.overallTone)} 30%, transparent)`,
            }}
          >
            {sentiment.overallTone}
          </div>

          {/* Percentage rows */}
          <div className="flex flex-col gap-2">
            {(['positive', 'neutral', 'negative'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: COLORS[key] }}
                />
                <span className="text-xs w-6" style={{ color: 'var(--text-secondary)' }}>
                  {LABELS[key]}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--border)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${sentiment[key]}%`,
                      background: COLORS[key],
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--text)' }}>
                  {sentiment[key]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Context note */}
      <p className="mt-4 text-xs leading-5 p-3 rounded-lg" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
        {sentiment.contextNote}
      </p>
    </div>
  );
}
