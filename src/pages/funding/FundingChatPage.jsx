// src/pages/funding/FundingChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { connectStomp, disconnectStomp } from '../../api/stompClient';
import useAuthStore from '../../stores/useAuthStore';
import { parseJwt } from '../../utils/parseJwt';
import { v4 as uuidv4 } from 'uuid';

const getMyId = () => {
    const token = localStorage.getItem('accessToken');
    const payload = parseJwt(token);
    return Number(payload?.sub);
};

const getSenderName = (senderId, createdBy) =>
    Number(senderId) === Number(createdBy) ? '관리자' : `유저${senderId}`;

export default function FundingChatPage() {
    const { id: fundingId } = useParams();
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [bannedUsers, setBannedUsers] = useState(new Set());
    const [showBanPanel, setShowBanPanel] = useState(false);
    const [banReason, setBanReason] = useState('');
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);
    const errorSubRef = useRef(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                const roomRes = await apiClient.get(`/api/chat/fundings/${fundingId}`);
                setRoom(roomRes.data);

                const token = accessToken || localStorage.getItem('accessToken') || null;
                let initialMessages = [];
                if (token) {
                    try {
                        const msgRes = await apiClient.get(`/api/chat/fundings/${roomRes.data.roomId}/messages`);
                        initialMessages = msgRes.data.messages || [];
                        setMessages(initialMessages);
                    } catch (err) {
                        console.warn('메시지 이력 조회 실패:', err);
                    }
                }
                const lastMsgId = initialMessages.reduce((max, m) => (m.messageId > max ? m.messageId : max), 0) || null;

                const client = connectStomp({
                    token,
                    onConnect: (stompClient) => {
                        setConnected(true);
                        stompRef.current = stompClient;

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !stompRef.current || !connected) return;
        stompRef.current.publish({
            destination: `/app/chat/send/${room.roomId}`,
            body: JSON.stringify({ clientMessageId: uuidv4(), content: input.trim() }),
        });
        setInput('');
    };

    const handleBan = async (targetId) => {
        if (!room) return;
        try {
            await apiClient.post(`/api/chat/fundings/${room.roomId}/ban`, {
                targetId,
                reason: banReason.trim() || undefined,
            });
            setBannedUsers((prev) => new Set([...prev, targetId]));
            setBanReason('');
        } catch (err) {
            alert('차단 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUnban = async (targetId) => {
        if (!room) return;
        try {
            await apiClient.delete(`/api/chat/fundings/${room.roomId}/ban/${targetId}`);
            setBannedUsers((prev) => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
        } catch (err) {
            alert('차단 해제 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="text-center py-12">채팅방 로딩 중...</div>;
    if (!room) return null;

    const myId = getMyId();
    const isAdmin = myId === Number(room.createdBy);

    // 메시지에서 등장한 고유 발신자 (나와 관리자 제외)
    const uniqueSenders = [...new Set(
        messages
            .map((m) => Number(m.senderId))
            .filter((id) => id && id !== myId && id !== Number(room.createdBy))
    )];

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
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            onClick={() => setShowBanPanel((v) => !v)}
                            className="text-xs px-3 py-1 rounded border border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                            관리자 패널
                        </button>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {connected ? '연결됨' : '연결 중...'}
                    </span>
                </div>
            </div>

            {/* 관리자 BAN 패널 */}
            {isAdmin && showBanPanel && (
                <div className="border-b bg-orange-50 p-4">
                    <h3 className="text-sm font-bold text-orange-700 mb-3">사용자 차단 관리</h3>
                    {uniqueSenders.length === 0 ? (
                        <p className="text-xs text-gray-400">차단할 수 있는 사용자가 없습니다.</p>
                    ) : (
                        <div className="space-y-2">
                            {uniqueSenders.map((senderId) => (
                                <div key={senderId} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700 w-16">유저{senderId}</span>
                                    {bannedUsers.has(senderId) ? (
                                        <button
                                            onClick={() => handleUnban(senderId)}
                                            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                                        >
                                            차단 해제
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBan(senderId)}
                                            className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                        >
                                            차단
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-3">
                        <input
                            type="text"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="차단 사유 (선택)"
                            className="w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                    </div>
                </div>
            )}

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 py-8">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</p>
                )}
                {messages.map((msg, idx) => {
                    const isMine = Number(msg.senderId) === myId;
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
                                    <p className="text-xs text-gray-500 mb-1">
                                        {getSenderName(msg.senderId, room.createdBy)}
                                    </p>
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
