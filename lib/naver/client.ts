import 'server-only';

import { getNaverClientId, getNaverClientSecret } from '@/lib/env';
import type { NaverNewsResponse, NewsArticle } from '@/lib/types';
import { stripHtml, extractSource } from './sanitize';

const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json';

export class NaverApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'NaverApiError';
  }
}

export async function searchNews(
  query: string,
  display: number = 30,
  sort: 'date' | 'sim' = 'date',
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    query,
    display: String(Math.min(Math.max(display, 1), 100)),
    start: '1',
    sort,
  });

  const res = await fetch(`${NAVER_NEWS_URL}?${params}`, {
    headers: {
      'X-Naver-Client-Id': getNaverClientId(),
      'X-Naver-Client-Secret': getNaverClientSecret(),
    },
    // Disable Next.js caching so results are always fresh
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new NaverApiError(
        '네이버 API 키가 올바르지 않습니다. .env.local의 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET을 확인해 주세요.',
        res.status,
      );
    }
    if (res.status === 429) {
      throw new NaverApiError(
        '네이버 검색 API 일일 사용 한도(25,000건)를 초과했습니다. 내일 다시 시도해 주세요.',
        429,
      );
    }
    throw new NaverApiError(`네이버 API 오류 (HTTP ${res.status})`, res.status);
  }

  const data = (await res.json()) as NaverNewsResponse;

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
    link: item.link,
    originallink: item.originallink || item.link,
    pubDate: item.pubDate,
    source: extractSource(item.originallink || item.link),
  }));
}
