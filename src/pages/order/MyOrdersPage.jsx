import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';

const STATUS_LABELS = {
    PENDING: '결제 대기',
    RESERVED: '예약됨',
    PAYING: '결제 중',
    PAID: '결제 완료',
    CONFIRMED: '확정',
    CANCELLED: '취소됨',
    REFUNDED: '환불 완료',
};

const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    RESERVED: 'bg-blue-100 text-blue-700',
    PAYING: 'bg-orange-100 text-orange-700',
    PAID: 'bg-green-100 text-green-700',
    CONFIRMED: 'bg-teal-100 text-teal-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function MyOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/orders')
            .then((res) => setOrders(res.data || []))
            .catch((err) => console.error('주문 목록 조회 실패:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-12">로딩 중...</div>;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">내 주문 내역</h2>

            {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-4">📦</p>
                    <p>주문 내역이 없습니다.</p>
                    <Link to="/" className="text-teal-600 font-bold mt-4 inline-block">펀딩 둘러보기 →</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <Link
                            key={order.orderId}
                            to={`/orders/${order.orderId}`}
                            className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-base truncate">{order.title}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-1">{order.orderNo}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(order.fundingDate).toLocaleString('ko-KR')}
                                    </p>
                                    {/* PENDING 상태일 때 결제 필요 표시 */}
                                    {order.orderStatus === 'PENDING' && (
                                        <p className="text-xs text-yellow-600 font-bold mt-1">
                                            💳 결제가 필요합니다
                                        </p>
                                    )}
                                </div>
                                <div className="text-right ml-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100'}`}>
                                        {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                                    </span>
                                    <p className="font-bold text-teal-600 mt-2">
                                        {order.billingAmount?.toLocaleString()}원
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}