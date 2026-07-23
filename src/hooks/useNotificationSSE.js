import { useEffect } from 'react';
import useAuthStore from '../stores/useAuthStore';

export default function useNotificationSSE(onNotificationReceived) {
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!token) return;

    const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
    const eventSource = new EventSource(`${gatewayUrl}/api/notifications/subscribe?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data);
      if (onNotificationReceived) {
        onNotificationReceived(data);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE Connection Error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token, onNotificationReceived]);
}
