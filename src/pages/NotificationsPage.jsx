import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/notifications')
            .then((res) => setNotifications(res.data?.notifications || res.data || []))
            .catch((err) => {
                console.error('알림 조회 실패:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleClick = (noti) => {
        // 주문 관련 알림이면 주문 상세로 이동
        if (noti.orderId) {
            navigate(`/orders/${noti.orderId}`);
        } else if (noti.fundingId) {
            navigate(`/fundings/${noti.fundingId}`);
        }

        // 읽음 처리 (API 있으면)
        if (!noti.isRead) {
            apiClient.patch(`/api/notifications/${noti.id}/read`).catch(() => {});
        }
    };

    if (loading) return <div className="text-center py-12">로딩 중...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">🔔 알림</h2>

            {notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-4">🔕</p>
                    <p>알림이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((noti, idx) => (
                        <div
                            key={noti.id || idx}
                            onClick={() => handleClick(noti)}
                            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                                noti.isRead ? 'bg-white' : 'bg-teal-50 border-teal-200'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-medium ${noti.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                        {noti.title || noti.message}
                                    </p>
                                    {noti.body && (
                                        <p className="text-sm text-gray-500 mt-1">{noti.body}</p>
                                    )}
                                </div>
                                {!noti.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {[noti.targetId, noti.createdAt && new Date(noti.createdAt).toLocaleString('ko-KR')]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}