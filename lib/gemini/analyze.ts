import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey, getGeminiModel } from '@/lib/env';
import type { NewsArticle, NewsSummaryResult } from '@/lib/types';

const MODEL_CANDIDATES = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
] as const;

// ─── Error helpers ─────────────────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isQuotaError(err: unknown): boolean {
  const msg = getErrorMessage(err);
  return msg.includes('429') || msg.includes('quota') || msg.includes('Quota');
}

function isOverloadedError(err: unknown): boolean {
  const msg = getErrorMessage(err);
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('Service Unavailable') ||
    msg.includes('UNAVAILABLE')
  );
}

function isModelUnavailableError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not supported for generatecontent')
  );
}

function isRetriableError(err: unknown): boolean {
  return isQuotaError(err) || isOverloadedError(err) || isModelUnavailableError(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getGeminiUserMessage(err: unknown): string {
  if (isQuotaError(err)) {
    return 'Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 사용량을 확인해 주세요.';
  }
  if (isOverloadedError(err)) {
    return 'Gemini 모델이 현재 과부하 상태입니다. 잠시 후 다시 시도해 주세요.';
  }
  if (isModelUnavailableError(err)) {
    return 'Gemini 모델을 사용할 수 없습니다. .env.local의 GEMINI_MODEL을 확인하거나 잠시 후 다시 시도해 주세요.';
  }
  return getErrorMessage(err) || 'AI 분석 중 오류가 발생했습니다.';
}

// ─── Prompt ────────────────────────────────────────────────────────────────

// Send at most 20 articles to Gemini to keep output token usage predictable
const MAX_ARTICLES_FOR_PROMPT = 20;
// Truncate each description to avoid bloating the prompt
const MAX_DESC_CHARS = 80;

function buildPrompt(query: string, articles: NewsArticle[]): string {
  const sample = articles.slice(0, MAX_ARTICLES_FOR_PROMPT);

  const articleList = sample
    .map((a, i) => {
      const desc = a.description.length > MAX_DESC_CHARS
        ? a.description.slice(0, MAX_DESC_CHARS) + '…'
        : a.description;
      return `[${i + 1}] ${a.title} | ${desc} | ${a.source}`;
    })
    .join('\n');

  return `
당신은 뉴스 분석 전문가입니다.
사용자 질문: "${query}"
기사 ${sample.length}개를 분석해 아래 JSON을 반환하세요. 모든 텍스트는 한국어로 작성하세요.

${articleList}

---
반환할 JSON (스키마를 정확히 따를 것):
{
  "searchKeyword": "핵심 검색 키워드 2~4단어",
  "summary": "전체 흐름 3문장 이내 요약",
  "keywords": [
    {"keyword": "키워드", "importance": 85, "reason": "중요 이유 한 문장"}
  ],
  "sentiment": {
    "positive": 40,
    "neutral": 35,
    "negative": 25,
    "overallTone": "혼재",
    "contextNote": "맥락 기반 감정 판단 근거 한 문장"
  },
  "positiveSummary": "긍정 관점 요약 2문장. 없으면 긍정적 관점의 기사가 없습니다.",
  "negativeSummary": "부정 관점 요약 2문장. 없으면 부정적 관점의 기사가 없습니다.",
  "trendInsights": [
    {"title": "트렌드명 8자이내", "description": "설명 2문장", "type": "rising"},
    {"title": "트렌드명2", "description": "설명2", "type": "controversy"}
  ],
  "articles": [
    {"title": "기사제목원문", "source": "출처", "pubDate": "원문날짜", "sentiment": "positive"}
  ]
}

규칙:
- 유효한 JSON만 반환. 마크다운 코드블록 금지.
- 문자열 안 큰따옴표는 반드시 \\" 로 이스케이프.
- 문자열 안 줄바꿈 금지.
- keywords 5개, trendInsights 3개, articles는 입력된 ${sample.length}개 모두 포함.
- summary, positiveSummary, negativeSummary, reason, description은 각각 100자 이내로 간결하게.
`.trim();
}

// ─── Normalizers ───────────────────────────────────────────────────────────

const VALID_TREND_TYPES = ['rising', 'declining', 'emerging', 'controversy'] as const;

function normalizeSentiment(raw: string | undefined): 'positive' | 'neutral' | 'negative' {
  const v = (raw ?? '').toLowerCase().trim();
  if (v === 'positive' || v.includes('긍정')) return 'positive';
  if (v === 'negative' || v.includes('부정')) return 'negative';
  return 'neutral';
}

function normalizeTrendType(raw: string): 'rising' | 'declining' | 'emerging' | 'controversy' {
  const v = (raw ?? '').toLowerCase().trim();
  if ((VALID_TREND_TYPES as readonly string[]).includes(v)) {
    return v as 'rising' | 'declining' | 'emerging' | 'controversy';
  }
  // Map common Korean / alternate values Gemini might return
  if (v.includes('상승') || v.includes('ris')) return 'rising';
  if (v.includes('하락') || v.includes('declin')) return 'declining';
  if (v.includes('신규') || v.includes('emerg')) return 'emerging';
  if (v.includes('논란') || v.includes('controv')) return 'controversy';
  return 'emerging';
}

// ─── Core analysis ─────────────────────────────────────────────────────────

type GeminiRaw = Omit<NewsSummaryResult, 'meta'> & {
  searchKeyword: string;
  articles: Array<{
    title: string;
    source: string;
    pubDate: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
};

async function analyzeWithModel(
  modelName: string,
  query: string,
  articles: NewsArticle[],
): Promise<GeminiRaw> {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(buildPrompt(query, articles));
  const raw = result.response.text();

  // Strip markdown code fences if the model wrapped the JSON anyway
  const text = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(text) as GeminiRaw;
  } catch (parseErr) {
    const preview = text.slice(0, 300);
    throw new Error(`Gemini 응답 JSON 파싱 실패: ${parseErr}\n응답 미리보기: ${preview}`);
  }
}

async function analyzeArticles(query: string, articles: NewsArticle[]): Promise<GeminiRaw> {
  const preferred = getGeminiModel();
  const ordered = [preferred, ...MODEL_CANDIDATES.filter((m) => m !== preferred)];

  let lastError: unknown;

  for (const modelName of ordered) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await analyzeWithModel(modelName, query, articles);
      } catch (err) {
        lastError = err;

        if (!isRetriableError(err)) throw err;

        const isLastAttempt = attempt === 2;
        if (isLastAttempt) break;

        // Only retry same model for 503 overload; quota/404 → next model immediately
        if (!isOverloadedError(err)) break;

        await sleep(2000 * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

// ─── Public entry point ────────────────────────────────────────────────────

export async function buildNewsSummary(
  query: string,
  articles: NewsArticle[],
): Promise<NewsSummaryResult> {
  const raw = await analyzeArticles(query, articles);

  // Gemini only processes the first MAX_ARTICLES_FOR_PROMPT articles
  const sentimentMap = new Map(
    (raw.articles ?? []).map((a, i) => [i, normalizeSentiment(a?.sentiment)]),
  );

  const analyzedArticles = articles.map((article, i) => ({
    title: article.title,
    source: article.source,
    pubDate: article.pubDate,
    link: article.link,
    sentiment: sentimentMap.get(i) ?? 'neutral',
  }));

  return {
    meta: {
      query,
      searchKeyword: raw.searchKeyword ?? query,
      articleCount: articles.length,
      analyzedAt: new Date().toISOString(),
    },
    summary: raw.summary,
    keywords: raw.keywords,
    sentiment: raw.sentiment,
    positiveSummary: raw.positiveSummary,
    negativeSummary: raw.negativeSummary,
    trendInsights: (raw.trendInsights ?? []).map((t) => ({
      ...t,
      type: normalizeTrendType(t.type),
    })),
    articles: analyzedArticles,
  };
}
