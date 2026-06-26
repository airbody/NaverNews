'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SentimentSummaryCardsProps {
  positiveSummary: string;
  negativeSummary: string;
}

export default function SentimentSummaryCards({
  positiveSummary,
  negativeSummary,
}: SentimentSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Positive */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(16,185,129,0.25)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--positive-bg)' }}
          >
            <ThumbsUp size={14} style={{ color: 'var(--positive)' }} />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--positive)' }}>
            긍정 뉴스 요약
          </h4>
        </div>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          {positiveSummary}
        </p>
      </div>

      {/* Negative */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(239,68,68,0.25)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--negative-bg)' }}
          >
            <ThumbsDown size={14} style={{ color: 'var(--negative)' }} />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--negative)' }}>
            부정 뉴스 요약
          </h4>
        </div>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          {negativeSummary}
        </p>
      </div>
    </div>
  );
}
