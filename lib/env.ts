import 'server-only';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name}이(가) 설정되지 않았습니다. .env.local 또는 배포 환경 변수에 추가해 주세요.`,
    );
  }
  return value;
}

export function getNaverClientId(): string {
  return requireEnv('NAVER_CLIENT_ID');
}

export function getNaverClientSecret(): string {
  return requireEnv('NAVER_CLIENT_SECRET');
}

export function getGeminiApiKey(): string {
  return requireEnv('GEMINI_API_KEY');
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
}
