import { useLocation, Link } from 'react-router-dom';

export default function OrderCancelResultPage() {
    const location = useLocation();
    const { orderNo } = location.state || {};

    return (
        <div className="max-w-md mx-auto p-6 text-center space-y-6 mt-12">
            <div className="text-6xl">🔄</div>
            <h2 className="text-2xl font-bold">주문 취소 요청 완료</h2>
            <p className="text-gray-600">
                환불 결과는 2~3일 내에 알림으로 안내드립니다.
            </p>

            {orderNo && (
                <div className="bg-gray-50 border rounded-lg p-4 text-sm">
                    <p>주문번호: <span className="font-mono font-bold">{orderNo}</span></p>
                </div>
            )}

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