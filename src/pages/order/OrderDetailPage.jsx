import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from '../../stores/useModalStore.js';
import {toKoreanTime} from "../../utils/formatDateTime.js";

const STATUS_LABELS = {
    PENDING: '결제 대기',
    RESERVED: '예약됨 (펀딩 성공 시 자동 결제)',
    PAYING: '결제 처리 중',
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

export default function OrderDetailPage() {
    const { openModal } = useModalStore();
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        apiClient.get(`/api/orders/${orderId}`)
            .then((res) => setOrder(res.data))
            .catch((err) => {
                openModal({ title: '조회 실패', message: err.response?.data?.message || err.message, type: 'error' });
                navigate('/orders');
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    // 결제 요청 (PENDING → PAYING)
    const handlePay = async () => {
        setPaying(true);
        try {
            // 1. 잔고 확인
            const walletRes = await apiClient.get('/api/payments/wallet');
            const balance = walletRes.data?.balance || 0;
            const amount = order.totalBillingAmount;

            // 2. 잔액 부족
            if (balance < amount) {
                openModal({
                    title: '잔액 부족',
                    message: `결제 금액: ${amount?.toLocaleString()}원\n보유 잔고: ${balance.toLocaleString()}원\n\n${(amount - balance).toLocaleString()}원이 부족합니다.\n월렛에서 충전 후 다시 시도해주세요.`,
                    type: 'warning',
                    confirmText: '월렛으로 이동',
                    cancelText: '닫기',
                    onConfirm: () => navigate('/wallet'),
                });
                setPaying(false);
                return;
            }

            // 3. 잔고 충분 → 결제 확인 모달
            openModal({
                title: '결제 확인',
                message: `월렛 잔고: ${balance.toLocaleString()}원\n결제 금액: ${amount?.toLocaleString()}원\n결제 후 잔고: ${(balance - amount).toLocaleString()}원\n\n결제를 진행하시겠습니까?`,
                type: 'confirm',
                confirmText: '결제하기',
                cancelText: '취소',
                onConfirm: () => processPayment(),
                onCancel: () => setPaying(false),
            });
        } catch (err) {
            openModal({
                title: '오류',
                message: '월렛 정보를 불러올 수 없습니다.\n' + (err.response?.data?.message || err.message),
                type: 'error',
            });
            setPaying(false);
        }
    };

    const processPayment = async () => {
        try {
            const res = await apiClient.post('/api/orders', {
                orderId: order.orderId || Number(orderId),
                fundingId: order.fundingId,
                isNowPay: true,
            });

            navigate('/order/pay-result', {
                state: {
                    orderNo: order.orderNo,
                    totalAmount: order.totalBillingAmount,
                    status: res.data?.orderStatus || 'PAYING',
                },
                replace: true,
            });
        } catch (err) {
            openModal({
                title: '결제 요청 실패',
                message: err.response?.data?.message || err.message,
                type: 'error',
            });
        } finally {
            setPaying(false);
        }
    };
    // 취소 요청
    const handleCancel = () => {
        const isRefund = ['PAID', 'CONFIRMED'].includes(order.orderStatus);

        openModal({
            title: isRefund ? '주문 취소 (환불)' : '주문 취소',
            message: isRefund
                ? '주문을 취소하시겠습니까?\n환불이 진행됩니다.'
                : '주문을 취소하시겠습니까?\n(결제 전이라 별도 환불은 없습니다.)',
            type: 'warning',
            confirmText: '취소하기',
            cancelText: '돌아가기',
            onConfirm: () => executeCancelOrder(isRefund),
        });
    };

    const executeCancelOrder = async (isRefund) => {
        setCancelling(true);
        try {
            await apiClient.patch(`/api/orders/${orderId}/cancel`, {
                fundingId: order.fundingId,
            });

            if (isRefund) {
                navigate('/order/cancel-result', {
                    state: { orderNo: order.orderNo },
                    replace: true,
                });
            } else {
                openModal({
                    title: '취소 완료',
                    message: '주문이 취소되었습니다.',
                    type: 'success',
                    onConfirm: () => navigate('/orders', { replace: true }),
                });
            }
        } catch (err) {
            openModal({ title: '취소 실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setCancelling(false);
        }
    };


    // 만료시간 계산
    const getTimeRemaining = () => {
        if (!order?.expiresAt) return null;
        const diff = new Date(order.expiresAt) - new Date();
        if (diff <= 0) return '만료됨';
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}시간 ${minutes % 60}분 남음`;
        return `${minutes}분 남음`;
    };

    const isCancellable = order && !['CANCELLED', 'REFUNDED', 'PAYING'].includes(order.orderStatus);
    const isRefundable = ['PAID', 'CONFIRMED'].includes(order?.orderStatus);
    const isPayable = order && order.orderStatus === 'PENDING' && !order.isEnded;
    const isExpired = order?.expiresAt && new Date(order.expiresAt) < new Date();

    if (loading) return <div className="text-center py-12">로딩 중...</div>;
    if (!order) return null;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">주문 상세</h2>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                </span>
            </div>

            {/* 상태별 안내 배너 */}
            {order.orderStatus === 'PENDING' && (
                <div className={`rounded-lg p-4 text-sm ${isExpired ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
                    {isExpired ? (
                        <p>⏰ 결제 기한이 만료되었습니다. 이 주문은 자동 취소됩니다.</p>
                    ) : (
                        <>
                            <p className="font-bold mb-1">💳 결제를 완료해주세요!</p>
                            <p>아직 결제가 완료되지 않은 주문입니다. 아래 결제하기 버튼을 눌러 결제를 진행해주세요.</p>
                            <p className="mt-2 font-mono font-bold text-yellow-800">
                                ⏰ 남은 시간: {getTimeRemaining()}
                                <span className="font-normal text-yellow-600 ml-2">
                                    (기한: {toKoreanTime(order.expiresAt)})
                                </span>
                            </p>
                        </>
                    )}
                </div>
            )}

            {order.orderStatus === 'RESERVED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-bold mb-1">📅 예약 주문</p>
                    <p>펀딩이 성공하면 자동으로 결제가 진행됩니다. 펀딩 실패 시 자동 취소됩니다.</p>
                </div>
            )}

            {order.orderStatus === 'PAYING' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
                    <p className="font-bold mb-1">⏳ 결제 처리 중</p>
                    <p>결제가 진행 중입니다. 잠시만 기다려주세요. 완료 시 알림으로 안내해드립니다.</p>
                </div>
            )}

            {order.orderStatus === 'PAID' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                    <p className="font-bold mb-1">✅ 결제 완료</p>
                    <p>결제가 완료되었습니다. 펀딩 종료 후 정산이 진행됩니다.</p>
                </div>
            )}

            {order.orderStatus === 'CANCELLED' && order.expiresAt && (
                // PENDING에서 삭제된 주문 (결제 전 취소)
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-bold mb-1">🗑️ 삭제된 주문서</p>
                    <p>결제 전 삭제된 주문입니다.</p>
                </div>
            )}

            {order.orderStatus === 'CANCELLED' && !order.expiresAt && (
                // PAID에서 취소된 주문 (환불 진행)
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    <p className="font-bold mb-1">❌ 주문 취소됨</p>
                    <p>이 주문은 취소되었습니다. 환불이 진행 중이라면 알림으로 안내해드립니다.</p>
                </div>
            )}

            {order.orderStatus === 'REFUNDED' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                    <p className="font-bold mb-1">💰 환불 완료</p>
                    <p>환불이 완료되었습니다. 월렛 잔고를 확인해주세요.</p>
                </div>
            )}

            {/* 기본 정보 */}
            <div className="border rounded-lg p-4 bg-white space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">주문번호</span>
                    <span className="font-mono font-bold">{order.orderNo}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">펀딩</span>
                    <span className="font-medium">{order.title}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">주문일시</span>
                    <span>{toKoreanTime(order.fundingDate)}</span>
                </div>
                {order.canceledAt && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">취소일시</span>
                        <span className="text-red-500">{toKoreanTime(order.canceledAt)}</span>
                    </div>
                )}
            </div>

            {/* 리워드 내역 */}
            <div className="border rounded-lg p-4 bg-white space-y-3">
                <h3 className="font-bold">리워드 내역</h3>
                {order.rewards?.map((reward, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-b-0">
                        <span>{reward.name} x{reward.qty}</span>
                        <span className="font-bold">{reward.amount?.toLocaleString()}원</span>
                    </div>
                ))}
            </div>

            {/* 금액 */}
            <div className="border rounded-lg p-4 bg-white space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>리워드 금액</span>
                    <span>{order.rewardAmount?.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                    <span>배송비</span>
                    <span>{order.totalShippingCharge?.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>총 결제 금액</span>
                    <span className="text-teal-600">{order.totalBillingAmount?.toLocaleString()}원</span>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
                <Link
                    to="/orders"
                    className="flex-1 text-center border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                    목록으로
                </Link>

                {isPayable && !isExpired && (
                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="flex-1 bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
                    >
                        {paying ? '처리 중...' : `${order.totalBillingAmount?.toLocaleString()}원 결제하기`}
                    </button>
                )}

                {isCancellable && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 disabled:bg-gray-300"
                    >
                        {cancelling ? '처리 중...' : isRefundable ? '주문 취소 (환불)' : '주문 취소'}
                    </button>
                )}
            </div>
        </div>
    );
}