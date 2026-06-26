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

function buildPrompt(query: string, articles: NewsArticle[]): string {
  const articleList = articles
    .map(
      (a, i) =>
        `[${i + 1}] 제목: ${a.title}\n    요약: ${a.description}\n    날짜: ${a.pubDate}\n    출처: ${a.source}`,
    )
    .join('\n\n');

  return `
당신은 뉴스 분석 전문가입니다.
사용자 질문: "${query}"

아래 ${articles.length}개의 뉴스 기사를 분석하여 JSON을 반환하세요.

뉴스 기사:
${articleList}

---
다음 JSON 스키마를 엄격히 따라 반환하세요. 모든 텍스트는 한국어로 작성하세요.

{
  "searchKeyword": "사용자 질문에서 추출한 핵심 검색 키워드 (2~4단어)",
  "summary": "뉴스 전체 흐름을 3~5문장으로 요약. 어떤 이슈가 왜 주목받는지 맥락 중심으로 서술.",
  "keywords": [
    {
      "keyword": "키워드",
      "importance": <0-100 정수, 기사 빈도+맥락 영향력 기준>,
      "reason": "이 키워드가 중요한 이유 한 문장"
    }
    // 상위 7개, importance 내림차순
  ],
  "sentiment": {
    "positive": <0-100 정수>,
    "neutral": <0-100 정수>,
    "negative": <0-100 정수>,
    "overallTone": "전반적 분위기를 한 단어로: 긍정적 / 부정적 / 혼재 / 중립적",
    "contextNote": "단순 긍정/부정어 매칭이 아닌, 기사 맥락을 고려한 감정 판단 근거 1~2문장"
  },
  "positiveSummary": "긍정적 관점의 기사들을 2~3문장으로 요약. 긍정 기사가 없으면 '긍정적 관점의 기사가 없습니다.'",
  "negativeSummary": "부정적 관점의 기사들을 2~3문장으로 요약. 부정 기사가 없으면 '부정적 관점의 기사가 없습니다.'",
  "trendInsights": [
    {
      "title": "트렌드 제목 (10자 이내)",
      "description": "이 트렌드가 왜 중요한지 2~3문장 설명",
      "type": "rising"
    },
    {
      "title": "트렌드 제목2",
      "description": "설명2",
      "type": "controversy"
    }
  ],
  "articles": [
    {
      "title": "기사 제목 (원문 그대로)",
      "source": "출처 도메인",
      "pubDate": "원문 pubDate 그대로",
      "sentiment": "positive"
    }
  ]
}

규칙:
- 반드시 유효한 JSON만 반환하세요. 마크다운 코드 블록(\`\`\`)을 절대 사용하지 마세요.
- 문자열 값 안에 큰따옴표(")를 넣을 때는 반드시 백슬래시로 이스케이프(\")하세요.
- 문자열 값 안에 줄바꿈을 넣지 마세요. 한 줄로 작성하세요.
- trendInsights는 정확히 3~5개, articles는 입력된 모든 기사에 대해 작성하세요.
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

  // Merge AI-assigned sentiment back with article links from the original list
  const analyzedArticles = articles.map((article, i) => ({
    title: article.title,
    source: article.source,
    pubDate: article.pubDate,
    link: article.link,
    sentiment: normalizeSentiment(raw.articles[i]?.sentiment),
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
