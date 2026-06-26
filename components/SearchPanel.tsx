'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Search, Clock, X } from 'lucide-react';

interface SearchPanelProps {
  onSearch: (query: string, display: number, sort: 'date' | 'sim') => void;
  loading: boolean;
}

const RECENT_KEY = 'naver-news-recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(query: string, prev: string[]): string[] {
  const next = [query, ...prev.filter((q) => q !== query)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export default function SearchPanel({ onSearch, loading }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [display, setDisplay] = useState(30);
  const [sort, setSort] = useState<'date' | 'sim'>('date');
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentLoaded = useRef(false);

  function handleSubmit() {
    const q = query.trim();
    if (!q || loading) return;
    setRecent((prev) => saveRecent(q, prev));
    setShowRecent(false);
    onSearch(q, display, sort);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowRecent(false);
  }

  function handleRecentClick(q: string) {
    setQuery(q);
    setShowRecent(false);
    onSearch(q, display, sort);
    setRecent((prev) => saveRecent(q, prev));
  }

  function removeRecent(q: string) {
    const next = recent.filter((r) => r !== q);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
          }}
        >
          <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!recentLoaded.current) {
                setRecent(loadRecent());
                recentLoaded.current = true;
              }
              setShowRecent(true);
            }}
            onBlur={() => setTimeout(() => setShowRecent(false), 150)}
            placeholder="키워드 또는 궁금한 문장을 입력하세요"
            maxLength={200}
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-muted)] disabled:opacity-50"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="flex-shrink-0">
              <X size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Recent searches dropdown */}
        {showRecent && recent.length > 0 && (
          <div
            className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-10"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div className="px-4 py-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Clock size={13} />
              <span className="text-xs">최근 검색</span>
            </div>
            {recent.map((q) => (
              <div
                key={q}
                className="flex items-center justify-between px-4 py-2 cursor-pointer"
                style={{ transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                onClick={() => handleRecentClick(q)}
              >
                <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {q}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(q);
                  }}
                  className="ml-2 flex-shrink-0"
                >
                  <X size={13} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Options row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* Display count */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            기사 수
          </span>
          {([10, 30, 50] as const).map((n) => (
            <button
              key={n}
              onClick={() => setDisplay(n)}
              disabled={loading}
              className="px-3 py-1 rounded-full text-xs transition-colors disabled:opacity-50"
              style={{
                background: display === n ? 'var(--accent)' : 'var(--surface)',
                color: display === n ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${display === n ? 'var(--accent)' : 'var(--border-light)'}`,
              }}
            >
              {n}건
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            정렬
          </span>
          {(['date', 'sim'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              disabled={loading}
              className="px-3 py-1 rounded-full text-xs transition-colors disabled:opacity-50"
              style={{
                background: sort === s ? 'var(--accent)' : 'var(--surface)',
                color: sort === s ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${sort === s ? 'var(--accent)' : 'var(--border-light)'}`,
              }}
            >
              {s === 'date' ? '최신순' : '관련도순'}
            </button>
          ))}
        </div>

        {/* Search button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="ml-auto px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          {loading ? '분석 중...' : '뉴스 요약'}
        </button>
      </div>
    </div>
  );
}
