'use client';

import { useState } from 'react';
import SearchPanel from '@/components/SearchPanel';
import LoadingState from '@/components/LoadingState';
import SummaryDashboard from '@/components/SummaryDashboard';
import type { NewsSummaryResult } from '@/lib/types';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string, display: number, sort: 'date' | 'sim') {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, display, sort }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '알 수 없는 오류가 발생했습니다.');
        return;
      }

      setResult(data as NewsSummaryResult);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeywordSearch(keyword: string) {
    handleSearch(keyword, 30, 'date');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-4"
        style={{
          background: 'rgba(10,15,30,0.92)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              N
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                뉴스 AI 요약기
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                네이버 뉴스 × Gemini AI
              </p>
            </div>
          </div>

          {/* Search */}
          <SearchPanel onSearch={handleSearch} loading={loading} />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && <LoadingState />}

        {/* Error */}
        {!loading && error && (
          <div
            className="rounded-2xl p-6 text-sm leading-6 fade-in"
            style={{
              background: 'var(--negative-bg)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--negative)',
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <div id="results">
            <SummaryDashboard result={result} onKeywordSearch={handleKeywordSearch} />
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
            >
              📰
            </div>
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              키워드나 궁금한 문장을 입력하면
              <br />
              최신 뉴스를 AI가 분석·요약해 드립니다
            </p>
            <div
              className="flex flex-wrap justify-center gap-2 mt-2"
            >
              {['삼성전자 HBM', '인공지능 규제', '원화 환율 전망', '부동산 대출', '코스피 전망'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleSearch(ex, 30, 'date')}
                  className="px-3 py-1.5 rounded-full text-xs transition-colors"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
