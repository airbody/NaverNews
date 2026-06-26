'use client';

import SummaryCard from './SummaryCard';
import KeywordChart from './KeywordChart';
import SentimentChart from './SentimentChart';
import SentimentSummaryCards from './SentimentSummaryCards';
import TrendInsightsPanel from './TrendInsightsPanel';
import NewsArticleList from './NewsArticleList';
import type { NewsSummaryResult } from '@/lib/types';

interface SummaryDashboardProps {
  result: NewsSummaryResult;
  onKeywordSearch: (keyword: string) => void;
}

export default function SummaryDashboard({ result, onKeywordSearch }: SummaryDashboardProps) {
  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* Full summary */}
      <SummaryCard result={result} />

      {/* Keyword + Sentiment side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <KeywordChart keywords={result.keywords} onKeywordClick={onKeywordSearch} />
        <SentimentChart sentiment={result.sentiment} />
      </div>

      {/* Positive / Negative summaries */}
      <SentimentSummaryCards
        positiveSummary={result.positiveSummary}
        negativeSummary={result.negativeSummary}
      />

      {/* Trend insights */}
      <TrendInsightsPanel insights={result.trendInsights} />

      {/* Article list */}
      <NewsArticleList articles={result.articles} />
    </div>
  );
}
