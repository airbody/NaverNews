// ─── Naver API raw response ────────────────────────────────────────────────

export interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
}

// ─── Parsed article (HTML stripped) ───────────────────────────────────────

export interface NewsArticle {
  title: string;
  description: string;
  link: string;
  originallink: string;
  pubDate: string;
  source: string;
}

// ─── AI analysis result ────────────────────────────────────────────────────

export interface KeywordItem {
  keyword: string;
  importance: number;
  reason: string;
}

export interface SentimentResult {
  positive: number;
  neutral: number;
  negative: number;
  overallTone: string;
  contextNote: string;
}

export type TrendType = 'rising' | 'declining' | 'emerging' | 'controversy';

export interface TrendInsight {
  title: string;
  description: string;
  type: TrendType;
}

export type ArticleSentiment = 'positive' | 'neutral' | 'negative';

export interface AnalyzedArticle {
  title: string;
  source: string;
  pubDate: string;
  link: string;
  sentiment: ArticleSentiment;
}

export interface NewsSummaryResult {
  meta: {
    query: string;
    searchKeyword: string;
    articleCount: number;
    analyzedAt: string;
  };
  summary: string;
  keywords: KeywordItem[];
  sentiment: SentimentResult;
  positiveSummary: string;
  negativeSummary: string;
  trendInsights: TrendInsight[];
  articles: AnalyzedArticle[];
}

// ─── API request / error ───────────────────────────────────────────────────

export interface SummarizeRequest {
  query: string;
  display?: number;
  sort?: 'date' | 'sim';
}

export interface ApiErrorResponse {
  error: string;
}
