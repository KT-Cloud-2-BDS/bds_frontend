/**
 * 환경별 URL 설정
 *
 * 로컬(dev): VITE_API_GATEWAY_URL이 비어있으면 '' (빈 문자열)
 *   → 상대경로 '/api/...' 요청 → Vite 프록시가 localhost:8000으로 전달
 *
 * 배포(prod): VITE_API_GATEWAY_URL = 'https://your-domain.com'
 *   → 절대경로 'https://your-domain.com/api/...' 요청
 *   → 프론트와 백엔드 도메인 동일하므로 CORS 없음
 */

export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export const WS_BASE_URL = import.meta.env.VITE_WS_GATEWAY_URL ||
    (import.meta.env.DEV ? 'ws://localhost:5173' : '');

// 디버깅용
if (import.meta.env.DEV) {
    console.log('[ENV] Mode:', import.meta.env.MODE);
    console.log('[ENV] API_BASE_URL:', API_BASE_URL || '(proxy)');
    console.log('[ENV] WS_BASE_URL:', WS_BASE_URL);
}