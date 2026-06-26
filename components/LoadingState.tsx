'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { label: '뉴스 검색 중...', sub: '네이버 최신 기사를 가져오는 중입니다.' },
  { label: 'AI 분석 중...', sub: 'Gemini가 키워드·감정·트렌드를 분석하고 있습니다.' },
  { label: '요약 생성 중...', sub: '분석 결과를 정리하고 있습니다.' },
];

export default function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="spinner" />

      <div className="text-center">
        <p className="text-base font-medium" style={{ color: 'var(--text)' }}>
          {STEPS[step].label}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {STEPS[step].sub}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === step ? '32px' : '8px',
              background: i <= step ? 'var(--accent)' : 'var(--border-light)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
