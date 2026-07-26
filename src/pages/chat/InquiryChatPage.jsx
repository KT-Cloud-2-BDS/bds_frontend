// src/pages/chat/InquiryChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { connectStomp, addSubscription, removeSubscription, unsubscribeAllExcept } from '../../api/stompClient';
import { parseJwt } from '../../utils/parseJwt';
import { v4 as uuidv4 } from 'uuid';

const getMyId = () => {
    const token = localStorage.getItem('accessToken');
    const payload = parseJwt(token);
    return Number(payload?.sub);
};

const getSenderName = (senderId, createdBy) =>
    Number(senderId) === Number(createdBy) ? '관리자' : `유저${senderId}`;

export default function InquiryChatPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [readReceipt, setReadReceipt] = useState({ userId: null, lastReadMessageId: 0 });
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);
    const readSubRef = useRef(null);
    const errorSubRef = useRef(null);
    const intervalRef = useRef(null);
    const messagesRef = useRef([]);

    // messagesRef를 최신 messages와 동기화 (interval 내 stale closure 방지)
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const initChat = async () => {
            try {
                // 문의 채팅방 상세 조회
                const roomRes = await apiClient.get(`/api/chat/Inquiries/${roomId}`);
                setRoom(roomRes.data);

                // 상대방의 lastReadMessageId로 readReceipt 초기화
                const myIdNum = getMyId();
                const otherP = roomRes.data.participants?.find((p) => p.memberId !== myIdNum);
                if (otherP) {
                    setReadReceipt({
                        userId: otherP.memberId,
                        lastReadMessageId: otherP.membership?.lastReadMessageId ?? 0,
                    });
                }

                // 메시지 이력 조회
                const msgRes = await apiClient.get(`/api/chat/Inquiries/${roomId}/messages`);
                const initialMessages = (msgRes.data.messages || [])
                    .sort((a, b) => (a.messageId || 0) - (b.messageId || 0));
                setMessages(initialMessages);
                const lastMsgId = initialMessages.reduce((max, m) => (m.messageId > max ? m.messageId : max), 0) || null;

                // WebSocket 연결
                const token = localStorage.getItem('accessToken');
                const client = connectStomp({
                    token,
                    onConnect: (stompClient) => {
                        setConnected(true);
                        stompRef.current = stompClient;

                        // 다른 채팅방 구독 모두 해제 후 현재 방만 구독
                        unsubscribeAllExcept();

                        // 메시지 구독
                        subscriptionRef.current = stompClient.subscribe(
                            `/topic/chat.room.${roomId}`,
                            (message) => {
                                const body = JSON.parse(message.body);
                                setMessages((prev) => [...prev, {
                                    messageId: body.seq || body.messageId,
                                    senderId: body.senderId,
                                    content: body.content,
                                    createdAt: body.sentAt || new Date().toISOString(),
                                    roomId: Number(roomId),
                                    isDeleted: false,
                                }]);
                            },
                            lastMsgId ? { lastMessageId: String(lastMsgId) } : {}
                        );
                        addSubscription('chat-msg', subscriptionRef.current);

                        // 읽음 이벤트 구독 + 에러 구독 (로그인 상태에서만)
                        if (token) {
                            readSubRef.current = stompClient.subscribe(
                                `/topic/chat.room.${roomId}.read`,
                                (frame) => {
                                    const event = JSON.parse(frame.body);
                                    const myIdNum = getMyId();
                                    if (event.userId !== myIdNum) {
                                        setReadReceipt({ userId: event.userId, lastReadMessageId: event.lastReadMessageId });
                                    }
                                }
                            );
                            addSubscription('chat-read', readSubRef.current);

                            errorSubRef.current = stompClient.subscribe(
                                '/user/queue/error',
                                (frame) => {
                                    console.error('[STOMP] 에러:', JSON.parse(frame.body));
                                }
                            );
                            addSubscription('chat-error', errorSubRef.current);

                            // 일정 시간마다 가장 큰 messageId를 read로 전송
                            intervalRef.current = setInterval(() => {
                                const msgs = messagesRef.current;
                                if (!msgs.length || !stompRef.current) return;
                                const maxId = Math.max(...msgs.map((m) => m.messageId).filter(Boolean));
                                if (maxId > 0) {
                                    stompRef.current.publish({
                                        destination: `/app/chat/read/${roomId}`,
                                        body: JSON.stringify({ lastReadMessageId: maxId }),
                                    });
                                }
                            }, 5000);
                        }
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
            if (readSubRef.current) readSubRef.current.unsubscribe();
            if (errorSubRef.current) errorSubRef.current.unsubscribe();
            if (intervalRef.current) clearInterval(intervalRef.current);
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

    const myId = getMyId();
    const otherParticipant = room.participants?.find((p) => p.memberId !== myId);

    // 상대방이 읽은 내 메시지 중 가장 마지막 messageId
    const lastReadMyMessageId = messages
        .filter((m) => Number(m.senderId) === myId && m.messageId && m.messageId <= readReceipt.lastReadMessageId)
        .reduce((max, m) => Math.max(max, m.messageId), 0);

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
                            상대방:{' '}
                            {otherParticipant
                                ? (Number(otherParticipant.memberId) === Number(room.createdBy)
                                    ? `관리자:유저${otherParticipant.memberId}`
                                    : `유저${otherParticipant.memberId}`)
                                : '알 수 없음'}
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
                        <div key={msg.messageId || idx} className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-lg ${
                                msg.isDeleted
                                    ? 'bg-gray-200 text-gray-400 italic'
                                    : isMine
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-white border'
                            }`}>
                                {!isMine && !msg.isDeleted && (
                                    <p className="text-xs text-gray-500 mb-1">{getSenderName(msg.senderId, room.createdBy)}</p>
                                )}
                                <p className="text-sm">{msg.isDeleted ? '삭제된 메시지입니다' : msg.content}</p>
                            </div>
                            <div className={`flex flex-col shrink-0 text-xs text-gray-400 ${isMine ? 'items-end' : 'items-start'}`}>
                                {isMine && !msg.isDeleted && msg.messageId && readReceipt.userId && readReceipt.userId !== myId && (
                                    msg.messageId > readReceipt.lastReadMessageId
                                        ? <span>1</span>
                                        : msg.messageId === lastReadMyMessageId && lastReadMyMessageId > 0
                                            ? <span>읽음</span>
                                            : null
                                )}
                                <span>{new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
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