import { useLocation, Link, Navigate } from 'react-router-dom';

export default function OrderReservedResultPage() {
    const location = useLocation();
    const { orderNo, totalAmount } = location.state || {};

    if (!orderNo) {
        return <Navigate to="/orders" replace />;
    }

    return (
        <div className="max-w-md mx-auto p-6 text-center space-y-6 mt-12">
            <div className="text-6xl">📅</div>
            <h2 className="text-2xl font-bold">예약 주문 완료</h2>
            <p className="text-gray-600">
                펀딩 성공/실패 시 알림으로 안내해드립니다.
            </p>

            <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-500">주문번호</span>
                    <span className="font-mono font-bold">{orderNo}</span>
                </div>
                {totalAmount && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">예약 금액</span>
                        <span className="font-bold text-blue-600">{totalAmount.toLocaleString()}원</span>
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