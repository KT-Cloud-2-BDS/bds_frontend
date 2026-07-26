import { Client } from '@stomp/stompjs';
import { WS_BASE_URL } from '../utils/envConfig';

let stompClient = null;
const subscriptions = new Map();

export const connectStomp = ({ token, onConnect, onError }) => {
    // 이미 연결된 경우 즉시 onConnect 호출
    if (stompClient?.active) {
        if (onConnect) onConnect(stompClient);
        return stompClient;
    }

    // 연결 중이지만 아직 active 아닌 경우 재생성
    if (stompClient && !stompClient.active) {
        try { stompClient.deactivate(); } catch (e) {}
        stompClient = null;
    }

    const wsUrl = `${WS_BASE_URL}/ws/chat`;

    stompClient = new Client({
        brokerURL: wsUrl,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
            console.log('[STOMP] Connected:', frame);
            if (onConnect) onConnect(stompClient);
        },
        onStompError: (frame) => {
            console.error('[STOMP] Error:', frame);
            if (onError) onError(frame);
        },
        onWebSocketError: (event) => {
            console.error('[STOMP] WebSocket Error:', event);
        },
        onDisconnect: () => {
            console.log('[STOMP] Disconnected');
            subscriptions.clear();
        },
    });

    stompClient.activate();
    return stompClient;
};

export const addSubscription = (key, sub) => {
    subscriptions.set(key, sub);
};

export const removeSubscription = (key) => {
    const sub = subscriptions.get(key);
    if (sub) {
        try { sub.unsubscribe(); } catch (e) {}
        subscriptions.delete(key);
    }
};

// keepKeys에 없는 모든 구독 해제
export const unsubscribeAllExcept = (...keepKeys) => {
    subscriptions.forEach((sub, key) => {
        if (!keepKeys.includes(key)) {
            try { sub.unsubscribe(); } catch (e) {}
            subscriptions.delete(key);
        }
    });
};

export const disconnectStomp = () => {
    if (stompClient && stompClient.active) {
        stompClient.deactivate();
        stompClient = null;
        subscriptions.clear();
    }
};

export const getStompClient = () => stompClient;
