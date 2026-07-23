import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../../stores/useAuthStore';
import apiClient from '../../api/apiClient.js';

export default function FundingOpenChat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const stompClientRef = useRef(null);
  const token = useAuthStore((state) => state.accessToken);

  const [anonName] = useState(() => {
    return '익명_' + Math.floor(1000 + Math.random() * 9000);
  });

  useEffect(() => {
    apiClient.get(`/api/chat/rooms/${roomId}/messages`)
      .then((res) => setMessages(res.data.content || res.data || []))
      .catch((err) => console.error(err));

    const socket = new SockJS((import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080') + '/ws-chat');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
          const received = JSON.parse(message.body);
          setMessages((prev) => [...prev, received]);
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [roomId, token]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !stompClientRef.current?.connected) return;

    const payload = {
      roomId,
      content: inputText,
      senderId: null,
      senderName: token ? '회원' : anonName,
    };

    stompClientRef.current.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify(payload),
    });

    setInputText('');
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col h-[400px] bg-gray-50">
      <div className="font-bold border-b pb-2 mb-2">
        실시간 오픈 채팅방 ({token ? '회원 참여 중' : `익명 참여: ${anonName}`})
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="bg-white p-2 rounded shadow-sm">
            <span className="text-xs font-bold text-teal-600 mr-2">
              {msg.senderName || '익명'}
            </span>
            <span className="text-sm">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={handleSendMessage}
          className="bg-teal-500 text-white px-4 py-2 rounded font-bold"
        >
          전송
        </button>
      </div>
    </div>
  );
}
