// src/pages/funding/FundingChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { connectStomp, disconnectStomp } from '../../api/stompClient';
import useAuthStore from '../../stores/useAuthStore';
import { v4 as uuidv4 } from 'uuid';

export default function FundingChatPage() {
    const { id: fundingId } = useParams();
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);
    const errorSubRef = useRef(null);

    // 1. 채팅방 정보 조회
    useEffect(() => {
        const initChat = async () => {
            try {
                // 공개 채팅방 조회
                const roomRes = await apiClient.get(`/api/chat/fundings/${fundingId}`);
                setRoom(roomRes.data);

                // 메시지 이력 조회 (auth required - 로그인 상태에서만)
                const token = accessToken || localStorage.getItem('accessToken') || null;
                let initialMessages = [];
                if (token) {
                    try {
                        const msgRes = await apiClient.get(`/api/chat/fundings/${roomRes.data.roomId}/messages`);
                        initialMessages = msgRes.data.messages || [];
                        setMessages(initialMessages);
                    } catch (err) {
                        console.warn('메시지 이력 ���회 실패:', err);
                    }
                }
                const lastMsgId = initialMessages.reduce((max, m) => (m.messageId > max ? m.messageId : max), 0) || null;

                // WebSocket 연결
                const client = connectStomp({
                    token,
                    onConnect: (stompClient) => {
                        setConnected(true);
                        stompRef.current = stompClient;

                        // 메시지 구독
                        subscriptionRef.current = stompClient.subscribe(
                            `/topic/chat.room.${roomRes.data.roomId}`,
                            (message) => {
                                const body = JSON.parse(message.body);
                                setMessages((prev) => [...prev, {
                                    messageId: body.seq || body.messageId,
                                    senderId: body.senderId,
                                    content: body.content,
                                    createdAt: body.sentAt || new Date().toISOString(),
                                    roomId: roomRes.data.roomId,
                                    isDeleted: false,
                                }]);
                            },
                            lastMsgId ? { lastMessageId: String(lastMsgId) } : {}
                        );

                        // 에러 구독 (로그인 상태에서만)
                        if (token) {
                            errorSubRef.current = stompClient.subscribe(
                                '/user/queue/error',
                                (frame) => {
                                    console.error('[STOMP] 에러:', JSON.parse(frame.body));
                                }
                            );
                        }
                    },
                    onError: (err) => {
                        console.error('STOMP 연결 실패:', err);
                    },
                });
            } catch (err) {
                console.error('채팅방 로딩 실패:', err);
                alert('채팅방을 불러올 수 없습니다.');
                navigate(`/fundings/${fundingId}`);
            } finally {
                setLoading(false);
            }
        };

        initChat();

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            if (errorSubRef.current) errorSubRef.current.unsubscribe();
            disconnectStomp();
        };
    }, [fundingId]);

    // 스크롤 하단 유지
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 메시지 전송
    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !stompRef.current || !connected) return;

        const clientMessageId = uuidv4();

        stompRef.current.publish({
            destination: `/app/chat/send/${room.roomId}`,
            body: JSON.stringify({
                clientMessageId,
                content: input.trim(),
            }),
        });

        setInput('');
    };

    if (loading) return <div className="text-center py-12">채팅방 로딩 중...</div>;
    if (!room) return null;

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            {/* 헤더 */}
            <div className="border-b p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/fundings/${fundingId}`)} className="text-gray-500 hover:text-gray-700">
                        ← 뒤로
                    </button>
                    <h2 className="font-bold text-lg">💬 공개 채팅방</h2>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {connected ? '연결됨' : '연결 중...'}
        </span>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 py-8">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</p>
                )}
                {messages.map((msg, idx) => {
                    const isMine = Number(msg.senderId) === Number(localStorage.getItem('userId'));
                    return (
                        <div key={msg.messageId || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-lg ${
                                msg.isDeleted
                                    ? 'bg-gray-200 text-gray-400 italic'
                                    : isMine
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-white border'
                            }`}>
                                {!isMine && !msg.isDeleted && (
                                    <p className="text-xs text-gray-500 mb-1">유저 {msg.senderId}</p>
                                )}
                                <p className="text-sm">{msg.isDeleted ? '삭제된 메시지입니다' : msg.content}</p>
                                <p className="text-xs opacity-60 mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            {accessToken ? (
                <form onSubmit={handleSend} className="border-t p-4 bg-white flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        disabled={!connected}
                    />
                    <button
                        type="submit"
                        disabled={!connected || !input.trim()}
                        className="bg-teal-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
                    >
                        전송
                    </button>
                </form>
            ) : (
                <div className="border-t p-4 bg-gray-50 text-center space-y-1">
                    <p className="text-sm text-gray-500">채팅에 참여하려면 로그인이 필요합니다.</p>
                    <Link to="/login" className="text-teal-600 font-bold text-sm hover:underline">로그인하기 →</Link>
                </div>
            )}
        </div>
    );
}