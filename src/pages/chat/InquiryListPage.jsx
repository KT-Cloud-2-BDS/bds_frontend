// src/pages/chat/InquiryListPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { connectStomp, addSubscription, removeSubscription } from '../../api/stompClient';

export default function InquiryListPage() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const roomSubsRef = useRef([]);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await apiClient.get('/api/chat/Inquiries');
                const roomList = res.data.rooms || [];
                setRooms(roomList);

                const token = localStorage.getItem('accessToken');
                if (!token || roomList.length === 0) return;

                connectStomp({
                    token,
                    onConnect: (stompClient) => {
                        roomList.forEach((room) => {
                            const sub = stompClient.subscribe(
                                `/topic/chat.room.${room.roomId}`,
                                (message) => {
                                    const body = JSON.parse(message.body);
                                    setRooms((prev) => prev.map((r) => {
                                        if (r.roomId !== room.roomId) return r;
                                        return {
                                            ...r,
                                            lastMessage: {
                                                content: body.content,
                                                createdAt: body.sentAt || new Date().toISOString(),
                                            },
                                            unreadCount: (r.unreadCount || 0) + 1,
                                        };
                                    }));
                                }
                            );
                            const key = `room-${room.roomId}`;
                            addSubscription(key, sub);
                            roomSubsRef.current.push(key);
                        });
                    },
                    onError: (err) => {
                        console.error('STOMP 연결 실패:', err);
                    },
                });
            } catch (err) {
                console.error('문의방 목록 조회 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            roomSubsRef.current.forEach((key) => removeSubscription(key));
            roomSubsRef.current = [];
        };
    }, []);

    if (loading) return <div className="text-center py-12">로딩 중...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">📩 내 문의 채팅</h2>

            {rooms.length === 0 ? (
                <p className="text-center text-gray-400 py-8">문의 내역이 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room) => (
                        <div
                            key={room.roomId}
                            onClick={() => navigate(`/chat/inquiries/${room.roomId}`)}
                            className="border rounded-lg p-4 bg-white hover:shadow-md cursor-pointer transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">펀딩 #{room.productId}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {room.lastMessage?.content || '메시지 없음'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">
                                        {room.lastMessage?.createdAt
                                            ? new Date(room.lastMessage.createdAt).toLocaleDateString('ko-KR')
                                            : ''}
                                    </p>
                                    {room.unreadCount > 0 && (
                                        <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {room.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
