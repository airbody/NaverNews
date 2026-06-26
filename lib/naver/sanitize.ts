// Naver Search API returns titles/descriptions with HTML tags like <b>, </b>
// and HTML entities like &quot;. This module strips them to plain text.

export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

// Extract source domain from a URL (e.g. "news.naver.com" → "naver")
export function extractSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    // For known Naver news aggregation links, fall back to original link
    return hostname;
  } catch {
    return url;
  }
}
