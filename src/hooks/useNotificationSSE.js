import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils/envConfig';
import useAuthStore from '../stores/useAuthStore';

export default function useNotificationSSE(onNotificationReceived) {
  const token = useAuthStore((state) => state.accessToken);
  const eventSourceRef = useRef(null);
  const callbackRef = useRef(onNotificationReceived);

  // 콜백 최신 상태 유지
  useEffect(() => {
    callbackRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    if (!token) return;

    const sseUrl = `${API_BASE_URL}/api/notifications/subscribe?token=${token}`;

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (callbackRef.current) {
          callbackRef.current(data);
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // 연결 유지용 heartbeat
    });

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection Error:', err);
      eventSource.close();

      // 5초 후 재연결 시도
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          console.log('[SSE] Attempting reconnect...');
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [token]);
}