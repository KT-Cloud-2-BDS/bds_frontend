import { Client } from '@stomp/stompjs';
import { WS_BASE_URL } from '../utils/envConfig';

let stompClient = null;

export const connectStomp = ({ token, onConnect, onError }) => {
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
        },
    });

    stompClient.activate();
    return stompClient;
};

export const disconnectStomp = () => {
    if (stompClient && stompClient.active) {
        stompClient.deactivate();
        stompClient = null;
    }
};

export const getStompClient = () => stompClient;