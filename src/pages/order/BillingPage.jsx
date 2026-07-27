import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from '../../stores/useModalStore.js';

export default function BillingPage() {
    const { fundingId, orderId } = useParams();
    const navigate = useNavigate();
    const { openModal } = useModalStore();

    const [billing, setBilling] = useState(null);
    const [funding, setFunding] = useState(null);
    const [wallet, setWallet] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!fundingId || !orderId) {
            openModal({ title: '경고', message: '잘못된 접근입니다.', type: 'warning' });
            navigate('/');
            return;
        }

        Promise.all([
            apiClient.get(`/api/orders/${orderId}`),
            apiClient.get(`/api/fundings/${fundingId}`),
            apiClient.get('/api/payments/wallet').catch(() => ({ data: null })),
        ])
            .then(([billingRes, fundingRes, walletRes]) => {
                setBilling(billingRes.data);
                setFunding(fundingRes.data);
                setWallet(walletRes.data);
            })
            .catch((err) => {
                openModal({ title: '조회 실패', message: err.response?.data?.message || err.message, type: 'error' });
                navigate(-1);
            })
            .finally(() => setLoading(false));
    }, [fundingId, orderId]);

    const isReserved = funding?.type === 'RESERVED';

    const handleConfirmOrder = async () => {
        if (!billing) return;
        setSubmitting(true);

        try {
            const res = await apiClient.post('/api/orders', {
                orderId: billing.orderId || Number(orderId),
                fundingId: Number(fundingId),
                isNowPay: !isReserved,
            });

            if (isReserved) {
                navigate('/order/reserved-result', {
                    state: {
                        orderNo: res.data.orderNo,
                        totalAmount: res.data.totalBillingAmount,
                    },
                    replace: true,
                });
            } else {
                navigate('/order/pay-result', {
                    state: {
                        orderNo: res.data.orderNo,
                        totalAmount: res.data.totalBillingAmount,
                        status: res.data.orderStatus,
                    },
                    replace: true,
                });
            }
        } catch (err) {
            openModal({ title: '주문 생성 실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-12">주문서 불러오는 중...</div>;
    if (!billing || !funding) return null;

    const hasWallet = wallet !== null && wallet !== undefined;
    const hasEnoughBalance = hasWallet && wallet.balance >= billing.totalBillingAmount;
    const canPay = hasWallet && hasEnoughBalance;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h2 className="text-2xl font-bold">주문서 확인</h2>

            {/* 펀딩 정보 */}
            <div className="border rounded-lg p-4 bg-white space-y-2">
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isReserved ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isReserved ? '예약 펀딩' : '즉시 펀딩'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        funding.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {funding.status === 'ACTIVE' ? '진행중' : funding.status}
                    </span>
                </div>
                <h3 className="font-bold text-lg">{funding.title}</h3>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>목표 금액: {funding.goalAmount?.toLocaleString()}원</span>
                    <span>현재 달성: {funding.currentAmount?.toLocaleString()}원</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="h-2 rounded-full bg-teal-400"
                        style={{ width: `${Math.min(Math.round((funding.currentAmount / funding.goalAmount) * 100), 100)}%` }}
                    />
                </div>
                <div className="text-xs text-gray-400">
                    {new Date(funding.startAt).toLocaleDateString('ko-KR')} ~ {new Date(funding.holdTo).toLocaleDateString('ko-KR')}
                </div>
            </div>

            {/* 주문 유형 안내 */}
            {isReserved ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-bold mb-1">📅 예약 펀딩 주문</p>
                    <p>펀딩이 성공하면 자동으로 결제가 진행됩니다.</p>
                    <p>펀딩 실패 시 주문은 자동 취소되며, 별도 결제는 발생하지 않습니다.</p>
                </div>
            ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
                    <p className="font-bold mb-1">⚡ 즉시 펀딩 주문</p>
                    <p>주문 확정 시 바로 결제가 요청됩니다.</p>
                    <p>월렛 잔고에서 즉시 차감됩니다.</p>
                </div>
            )}

            {/* 리워드 목록 */}
            <div className="border rounded-lg p-4 bg-white space-y-3">
                <h3 className="font-bold">선택한 리워드</h3>
                {billing.rewards?.map((reward, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-b-0">
                        <span>{reward.name} x{reward.qty}</span>
                        <span className="font-bold">{reward.amount?.toLocaleString()}원</span>
                    </div>
                ))}
            </div>

            {/* 금액 요약 */}
            <div className="border rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between text-sm">
                    <span>리워드 금액</span>
                    <span>{billing.rewardAmount?.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>배송비</span>
                    <span>{billing.totalShippingCharge?.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>총 결제 금액</span>
                    <span className="text-teal-600">{billing.totalBillingAmount?.toLocaleString()}원</span>
                </div>
            </div>

            {/* 월렛 상태 */}
            <div className="border rounded-lg p-4 bg-white space-y-3">
                <h3 className="font-bold">결제 수단 (월렛)</h3>

                {!hasWallet && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-3">
                        <p className="text-red-600 font-medium">⚠️ 월렛이 없어 주문이 불가합니다.</p>
                        <Link
                            to="/wallet"
                            className="inline-block bg-teal-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-600"
                        >
                            월렛 만들러 가기 →
                        </Link>
                    </div>
                )}

                {hasWallet && !hasEnoughBalance && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>현재 잔고</span>
                            <span className="font-bold text-red-500">{wallet.balance?.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>부족 금액</span>
                            <span className="font-bold text-red-500">
                                {(billing.totalBillingAmount - wallet.balance).toLocaleString()}원
                            </span>
                        </div>
                        <p className="text-yellow-700 font-medium">⚠️ 잔고가 부족합니다.</p>
                        <Link
                            to="/wallet"
                            className="inline-block bg-teal-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-600"
                        >
                            잔고 충전하러 가기 →
                        </Link>
                    </div>
                )}

                {canPay && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                            <span>현재 잔고</span>
                            <span className="font-bold text-green-600">{wallet.balance?.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span>결제 후 잔고</span>
                            <span className="text-gray-600">
                                {(wallet.balance - billing.totalBillingAmount).toLocaleString()}원
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 만료 시간 */}
            {billing.expiresAt && (
                <p className="text-xs text-red-500 text-center">
                    ⏰ 이 주문서는 {new Date(billing.expiresAt).toLocaleString('ko-KR')}까지 유효합니다.
                </p>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
                <Link
                    to={`/fundings/${fundingId}`}
                    className="flex-1 text-center border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                    이전으로
                </Link>
                <button
                    onClick={handleConfirmOrder}
                    disabled={!canPay || submitting}
                    className="flex-1 bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {submitting
                        ? '처리 중...'
                        : !hasWallet
                            ? '월렛 필요'
                            : !hasEnoughBalance
                                ? '잔고 부족'
                                : isReserved
                                    ? '예약 주문 확정'
                                    : '결제하기'}
                </button>
            </div>
        </div>
    );
}