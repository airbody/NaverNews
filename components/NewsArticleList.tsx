'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalyzedArticle, ArticleSentiment } from '@/lib/types';

interface NewsArticleListProps {
  articles: AnalyzedArticle[];
}

const SENTIMENT_CONFIG: Record<
  ArticleSentiment,
  { label: string; color: string; bg: string }
> = {
  positive: { label: '긍정', color: 'var(--positive)', bg: 'var(--positive-bg)' },
  neutral: { label: '중립', color: 'var(--neutral)', bg: 'var(--neutral-bg)' },
  negative: { label: '부정', color: 'var(--negative)', bg: 'var(--negative-bg)' },
};

function formatDate(pubDate: string): string {
  try {
    return new Date(pubDate).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return pubDate;
  }
}

const INITIAL_SHOW = 8;

export default function NewsArticleList({ articles }: NewsArticleListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? articles : articles.slice(0, INITIAL_SHOW);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          참고 기사 ({articles.length}건)
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((article, i) => {
          const cfg = SENTIMENT_CONFIG[article.sentiment];
          return (
            <a
              key={`${article.link}-${i}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl group transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Sentiment badge */}
              <span
                className="flex-shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>

              {/* Title */}
              <span
                className="flex-1 text-sm leading-5 group-hover:underline"
                style={{ color: 'var(--text)' }}
              >
                {article.title}
              </span>

              {/* Meta */}
              <div
                className="flex-shrink-0 flex items-center gap-2 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="hidden sm:block">{article.source}</span>
                <span className="hidden sm:block">{formatDate(article.pubDate)}</span>
                <ExternalLink size={12} className="group-hover:opacity-100 opacity-40" />
              </div>
            </a>
          );
        })}
      </div>

      {articles.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-colors"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          {expanded ? (
            <>
              <ChevronUp size={15} /> 접기
            </>
          ) : (
            <>
              <ChevronDown size={15} /> {articles.length - INITIAL_SHOW}건 더 보기
            </>
          )}
        </button>
      )}
    </div>
  );
}
