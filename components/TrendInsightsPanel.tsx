'use client';

import { TrendingUp, TrendingDown, Zap, AlertCircle, Lightbulb } from 'lucide-react';
import type { TrendInsight, TrendType } from '@/lib/types';

interface TrendInsightsPanelProps {
  insights: TrendInsight[];
}

const TYPE_CONFIG: Record<
  TrendType,
  { label: string; color: string; bg: string; border: string; Icon: React.FC<{ size?: number }> }
> = {
  rising: {
    label: '상승',
    color: 'var(--positive)',
    bg: 'var(--positive-bg)',
    border: 'rgba(16,185,129,0.3)',
    Icon: TrendingUp,
  },
  declining: {
    label: '하락',
    color: 'var(--negative)',
    bg: 'var(--negative-bg)',
    border: 'rgba(239,68,68,0.3)',
    Icon: TrendingDown,
  },
  emerging: {
    label: '신규',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.3)',
    Icon: Zap,
  },
  controversy: {
    label: '논란',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    Icon: AlertCircle,
  },
};

export default function TrendInsightsPanel({ insights }: TrendInsightsPanelProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb size={17} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          트렌드 인사이트
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight) => {
          const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG['emerging'];
          const { Icon } = cfg;
          return (
            <div
              key={insight.title}
              className="flex gap-4 p-4 rounded-xl"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {insight.title}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
