import { NextRequest, NextResponse } from 'next/server';
import { searchNews, NaverApiError } from '@/lib/naver/client';
import { buildNewsSummary, getGeminiUserMessage } from '@/lib/gemini/analyze';
import type { SummarizeRequest, NewsSummaryResult, ApiErrorResponse } from '@/lib/types';

// ─── Simple in-memory cache (5 min TTL) ────────────────────────────────────

interface CacheEntry {
  result: NewsSummaryResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(query: string, display: number, sort: string): string {
  return `${query.toLowerCase()}|${display}|${sort}`;
}

function getFromCache(key: string): NewsSummaryResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: NewsSummaryResult): void {
  // Limit cache size to prevent unbounded memory growth
  if (cache.size >= 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: SummarizeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json<ApiErrorResponse>(
      { error: '검색어를 입력해 주세요.' },
      { status: 400 },
    );
  }
  if (query.length > 200) {
    return NextResponse.json<ApiErrorResponse>(
      { error: '검색어는 200자 이하로 입력해 주세요.' },
      { status: 400 },
    );
  }

  const display = Math.min(Math.max(body.display ?? 30, 10), 50);
  const sort = body.sort ?? 'date';

  const cacheKey = getCacheKey(query, display, sort);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const articles = await searchNews(query, display, sort);

    if (articles.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `"${query}"에 대한 뉴스를 찾지 못했습니다. 다른 키워드로 검색해 보세요.` },
        { status: 404 },
      );
    }

    const result = await buildNewsSummary(query, articles);
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof NaverApiError) {
      const status = err.status === 429 ? 429 : 502;
      return NextResponse.json<ApiErrorResponse>({ error: err.message }, { status });
    }
    const message = getGeminiUserMessage(err);
    return NextResponse.json<ApiErrorResponse>({ error: message }, { status: 500 });
  }
}
