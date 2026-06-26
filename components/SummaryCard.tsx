'use client';

import { useState } from 'react';
import { Copy, Check, Newspaper } from 'lucide-react';
import type { NewsSummaryResult } from '@/lib/types';

interface SummaryCardProps {
  result: NewsSummaryResult;
}

export default function SummaryCard({ result }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `# ${result.meta.searchKeyword} 뉴스 요약\n\n${result.summary}\n\n분석 시각: ${new Date(result.meta.analyzedAt).toLocaleString('ko-KR')}\n기사 수: ${result.meta.articleCount}건`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Newspaper size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            AI 뉴스 요약
          </h2>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            background: copied ? 'var(--positive-bg)' : 'var(--surface-hover)',
            color: copied ? 'var(--positive)' : 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? '복사됨' : '요약 복사'}
        </button>
      </div>

      <p
        className="mt-4 text-sm leading-7"
        style={{ color: 'var(--text)' }}
      >
        {result.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>
          검색어:{' '}
          <span style={{ color: 'var(--accent)' }}>{result.meta.searchKeyword}</span>
        </span>
        <span>·</span>
        <span>기사 {result.meta.articleCount}건</span>
        <span>·</span>
        <span>{new Date(result.meta.analyzedAt).toLocaleString('ko-KR')}</span>
      </div>
    </div>
  );
}
