// src/pages/chat/InquiryChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { connectStomp, disconnectStomp } from '../../api/stompClient';
import { v4 as uuidv4 } from 'uuid';

export default function InquiryChatPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                // 문의 채팅방 상세 조회
                const roomRes = await apiClient.get(`/api/chat/Inquiries/${roomId}`);
                setRoom(roomRes.data);

                // 메시지 이력 조회
                const msgRes = await apiClient.get(`/api/chat/Inquiries/${roomId}/messages`);
                setMessages(msgRes.data.messages || []);

                // WebSocket 연결
                const token = localStorage.getItem('accessToken');
                const client = connectStomp({
                    token,
                    onConnect: (stompClient) => {
                        setConnected(true);
                        stompRef.current = stompClient;

                        // 메시지 구독
                        subscriptionRef.current = stompClient.subscribe(
                            `/topic/chat.room.${roomId}`,
                            (message) => {
                                const body = JSON.parse(message.body);
                                setMessages((prev) => [...prev, {
                                    messageId: body.seq || body.messageId,
                                    senderId: body.senderId,
                                    content: body.content,
                                    createdAt: body.timestamp || new Date().toISOString(),
                                    roomId: Number(roomId),
                                    isDeleted: false,
                                }]);
                            }
                        );
                    },
                    onError: (err) => {
                        console.error('STOMP 연결 실패:', err);
                    },
                });
            } catch (err) {
                console.error('문의 채팅방 로딩 실패:', err);
                alert('문의 채팅방을 불러올 수 없습니다.');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        initChat();

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            disconnectStomp();
        };
    }, [roomId]);

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
            destination: `/app/chat/send/${roomId}`,
            body: JSON.stringify({
                clientMessageId,
                content: input.trim(),
            }),
        });

        setInput('');
    };

    // 채팅방 나가기
    const handleLeave = async () => {
        if (!confirm('정말 이 문의방을 나가시겠습니까?')) return;
        try {
            await apiClient.delete(`/api/chat/Inquiries/${roomId}/members/me`);
            alert('문의방을 나갔습니다.');
            navigate('/chat/inquiries');
        } catch (err) {
            alert('나가기 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="text-center py-12">채팅방 로딩 중...</div>;
    if (!room) return null;

    const myId = Number(localStorage.getItem('userId'));
    const otherParticipant = room.participants?.find((p) => p !== myId);

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            {/* 헤더 */}
            <div className="border-b p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                        ← 뒤로
                    </button>
                    <div>
                        <h2 className="font-bold text-lg">📩 1:1 문의</h2>
                        <p className="text-xs text-gray-400">
                            상대방: 유저 {otherParticipant || '알 수 없음'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {connected ? '연결됨' : '연결 중...'}
          </span>
                    <button
                        onClick={handleLeave}
                        className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50"
                    >
                        나가기
                    </button>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 py-8">아직 메시지가 없습니다. 문의 내용을 입력해보세요!</p>
                )}
                {messages.map((msg, idx) => {
                    const isMine = msg.senderId === myId;
                    const isSystem = msg.senderId === null;

                    if (isSystem) {
                        return (
                            <div key={msg.messageId || idx} className="text-center">
                <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
                            </div>
                        );
                    }

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
            <form onSubmit={handleSend} className="border-t p-4 bg-white flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="문의 내용을 입력하세요..."
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
        </div>
    );
}