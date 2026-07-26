import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function ChatHistoryPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const observerRef = useRef();

    const fetchMessages = useCallback(async (cursor) => {
        if (loading) return;
        setLoading(true);
        try {
            const params = cursor != null ? { cursor } : {};
            const res = await apiClient.get('/api/chat/rooms/messages', { params });
            const data = res.data;
            setMessages((prev) => cursor != null ? [...prev, ...(data.messages || [])] : (data.messages || []));
            setHasNext(data.hasNext ?? false);
            setNextCursor(data.nextCursor ?? null);
        } catch (err) {
            console.error('채팅 이력 조회 실패:', err);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }, []);

    useEffect(() => {
        fetchMessages(null);
    }, [fetchMessages]);

    const lastMsgRef = useCallback((node) => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNext && nextCursor != null) {
                fetchMessages(nextCursor);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, hasNext, nextCursor, fetchMessages]);

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">←</button>
                <h2 className="text-2xl font-bold">💬 내 채팅 이력</h2>
            </div>

            <div className="flex gap-3 mb-6 border-b pb-4">
                <Link
                    to="/chat/inquiries"
                    className="text-sm text-gray-500 hover:text-teal-600"
                >
                    📩 문의 채팅방
                </Link>
                <span className="text-sm font-bold text-teal-600 border-b-2 border-teal-500 pb-1">
                    💬 전체 이력
                </span>
            </div>

            {initialized && messages.length === 0 && (
                <p className="text-center text-gray-400 py-16">채팅 이력이 없습니다.</p>
            )}

            <div className="space-y-3">
                {messages.map((msg, idx) => (
                    <div
                        key={msg.messageId}
                        ref={idx === messages.length - 1 ? lastMsgRef : null}
                        className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                                        채팅방 #{msg.roomId}
                                    </span>
                                    {msg.type && msg.type !== 'TEXT' && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                            {msg.type}
                                        </span>
                                    )}
                                    {msg.isDeleted && (
                                        <span className="text-xs bg-red-50 text-red-400 px-2 py-0.5 rounded-full">
                                            삭제됨
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate ${msg.isDeleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                    {msg.isDeleted ? '삭제된 메시지입니다' : msg.content}
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 shrink-0">
                                {new Date(msg.createdAt).toLocaleString('ko-KR', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <div className="text-center py-8 text-gray-400">로딩 중...</div>}
            {!hasNext && messages.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">모든 이력을 불러왔습니다.</div>
            )}
        </div>
    );
}
