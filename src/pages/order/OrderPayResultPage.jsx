import { useLocation, Link, Navigate } from 'react-router-dom';

const STATUS_CONFIG = {
    PAYING: {
        icon: '⏳',
        title: '결제 요청 완료',
        description: '결제가 요청되었습니다.\n처리 완료 시 알림으로 안내해드립니다.',
        color: 'text-teal-600',
    },
    RESERVED: {
        icon: '📅',
        title: '예약 주문 완료',
        description: '펀딩이 성공하면 자동으로 결제가 진행됩니다.\n펀딩 실패 시 자동 취소됩니다.',
        color: 'text-blue-600',
    },
};

export default function OrderPayResultPage() {
    const location = useLocation();
    const { orderNo, totalAmount, status } = location.state || {};

    if (!orderNo) {
        return <Navigate to="/orders" replace />;
    }

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PAYING;

    return (
        <div className="max-w-md mx-auto p-6 text-center space-y-6 mt-12">
            <div className="text-6xl">{config.icon}</div>
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-gray-600 whitespace-pre-line">{config.description}</p>

            <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-500">주문번호</span>
                    <span className="font-mono font-bold">{orderNo}</span>
                </div>
                {totalAmount && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">결제 금액</span>
                        <span className={`font-bold ${config.color}`}>{totalAmount.toLocaleString()}원</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <Link
                    to="/orders"
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 text-center"
                >
                    내 주문 보기
                </Link>
                <Link
                    to="/"
                    className="w-full border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50 text-center"
                >
                    홈으로
                </Link>
            </div>
        </div>
    );
}