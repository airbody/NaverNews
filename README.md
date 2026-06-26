# 뉴스 AI 요약기

네이버 뉴스 Search API와 Google Gemini AI를 활용해 키워드 기반 뉴스를 검색·분석·요약하는 웹 서비스입니다.

## 주요 기능

- **AI 전체 요약** — 검색된 기사를 3~5문장으로 종합 요약
- **핵심 키워드 추출** — 중요도 점수와 근거 포함, 클릭 시 재검색
- **맥락 기반 감정 분석** — 긍정/중립/부정 비율 + 판단 근거 설명
- **긍정·부정 뉴스 요약** — 각 관점의 기사를 독립적으로 요약
- **트렌드 인사이트** — 상승/하락/신규/논란 유형별 트렌드 분석
- **참고 기사 목록** — 기사별 감정 태그 + 원문 링크
- **최근 검색 이력** — localStorage 기반, 클릭으로 재검색
- **서버 캐시** — 동일 검색 5분 TTL (Naver API 일 25,000건 절약)

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| 차트 | recharts |
| 외부 API | 네이버 Search API, `@google/generative-ai` |
| 배포 | Vercel |

## 로컬 개발

### 1. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 키를 채웁니다.

```bash
cp .env.example .env.local
```

```env
NAVER_CLIENT_ID=<네이버 Client ID>
NAVER_CLIENT_SECRET=<네이버 Client Secret>
GEMINI_API_KEY=<Google Gemini API Key>
GEMINI_MODEL=gemini-2.5-flash-lite   # 선택 사항
```

> API 키 발급
> - 네이버: https://developers.naver.com/apps/
> - Gemini: https://aistudio.google.com/

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

## Vercel 배포

1. GitHub에 리포지터리를 push합니다.
2. [Vercel](https://vercel.com)에서 프로젝트를 import합니다.
3. **Settings → Environment Variables**에 아래 4개 항목을 추가합니다.

   | 이름 | 값 |
   |------|----|
   | `NAVER_CLIENT_ID` | 네이버 Client ID |
   | `NAVER_CLIENT_SECRET` | 네이버 Client Secret |
   | `GEMINI_API_KEY` | Gemini API Key |
   | `GEMINI_MODEL` | `gemini-2.5-flash-lite` (선택) |

4. **Deploy**를 클릭합니다.

## 프로젝트 구조

```
NaverNews/
├── app/
│   ├── api/news/summarize/route.ts   # POST API — 검색→AI 분석 파이프라인
│   ├── layout.tsx
│   ├── page.tsx                      # 메인 페이지 (검색→로딩→결과 상태 관리)
│   └── globals.css
├── components/
│   ├── SearchPanel.tsx               # 검색 입력 + 옵션 + 최근 검색
│   ├── LoadingState.tsx              # 단계별 로딩 UX
│   ├── SummaryDashboard.tsx          # 결과 전체 레이아웃
│   ├── SummaryCard.tsx               # 전체 요약 + 복사 버튼
│   ├── KeywordChart.tsx              # 키워드 중요도 막대 차트
│   ├── SentimentChart.tsx            # 감정 도넛 차트
│   ├── SentimentSummaryCards.tsx     # 긍정·부정 요약 카드
│   ├── TrendInsightsPanel.tsx        # 트렌드 인사이트
│   └── NewsArticleList.tsx           # 기사 목록 + 감정 태그
├── lib/
│   ├── env.ts                        # 환경 변수 (server-only)
│   ├── types.ts                      # 공유 타입 정의
│   ├── naver/client.ts               # Naver News API 클라이언트
│   ├── naver/sanitize.ts             # HTML 태그·엔티티 제거
│   └── gemini/analyze.ts             # Gemini 프롬프트 + fallback/retry
├── .env.example
└── .gitignore
```
