import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from '../../stores/useModalStore.js';

export default function FundingDetailPage() {
  const { id } = useParams();
  const { openModal } = useModalStore();
  const navigate = useNavigate();
  const [funding, setFunding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRewards, setSelectedRewards] = useState({});
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    apiClient.get(`/api/fundings/${id}`)
        .then((res) => setFunding(res.data))
        .catch((err) => {
          console.error('펀딩 상세 조회 실패:', err);
          openModal({ title: '펀딩 상세 조회 실패', message: (err.response?.data?.message || err.message), type: 'error' });
          navigate('/');
        })
        .finally(() => setLoading(false));
  }, [id]);

  const handleQtyChange = (rewardId, qty) => {
    setSelectedRewards((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[rewardId];
      } else {
        next[rewardId] = qty;
      }
      return next;
    });
  };

  const handleOrder = async () => {
    const rewardEntries = Object.entries(selectedRewards);
    if (rewardEntries.length === 0) {
      openModal({ title: '안내', message: '리워드를 1개 이상 선택해주세요.', type: 'info' });
      return;
    }

    const rewards = rewardEntries.map(([rewardId, qty]) => ({ id: Number(rewardId), qty }));
    const isReserved = funding.type === 'RESERVED';

    setOrdering(true);
    try {
      // 주문서(billing) 생성
      const res = await apiClient.post('/api/orders/billing', {
        fundingId: funding.id,
        isReservedOrder: isReserved,
        rewards,
      });

      const orderId = res.data.orderId;

      // billing 페이지로 이동
      navigate(`/fundings/${funding.id}/billing/${orderId}`);
    } catch (err) {
      openModal({ title: '주문서 생성 실패', message: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setOrdering(false);
    }
  };

  const handleInquiry = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      openModal({title: '안내', message: '로그인이 필요합니다.', type: 'info'});
      navigate('/login');
      return;
    }

    try {
      const res = await apiClient.post('/api/chat/Inquiries', { productId: Number(id) });
      navigate(`/chat/inquiries/${res.data.roomId}`);
    } catch (err) {
      openModal({title: '문의방 생성 실패', message: (err.response?.data?.message || err.message), type: 'error'});
    }
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;
  if (!funding) return null;

  const isReserved = funding.type === 'RESERVED';
  const progressPercent = funding.goalAmount > 0
      ? Math.min(Math.round((funding.currentAmount / funding.goalAmount) * 100), 100)
      : 0;
  const isExpired = funding.status !== 'SCHEDULED' && funding.holdTo && new Date(funding.holdTo) < new Date();
  const isScheduled = funding.status === 'SCHEDULED';
  const isOrderable = funding.status === 'ACTIVE' && !isExpired;

  return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 상단 정보 */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isReserved ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isReserved ? '예약 펀딩' : '즉시 펀딩'}
                    </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                funding.status === 'ACTIVE' ? 'bg-green-100 text-green-700'
                    : funding.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
            }`}>
                        {funding.status === 'ACTIVE' ? '진행중' : funding.status === 'SCHEDULED' ? '예정' : funding.status}
                    </span>
          </div>
          <h1 className="text-3xl font-bold mt-1">{funding.title}</h1>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(funding.startAt).toLocaleDateString('ko-KR')} ~ {new Date(funding.holdTo).toLocaleDateString('ko-KR')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 왼쪽: 진행률 + 리워드 선택 */}
          <div className="md:col-span-2 space-y-6">
            {/* 진행률 */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-teal-600">{progressPercent}% 달성</span>
                <span className="text-gray-500">{funding.participationCnt}명 참여</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                    className="h-3 rounded-full bg-teal-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>현재 {funding.currentAmount?.toLocaleString()}원</span>
                <span>목표 {funding.goalAmount?.toLocaleString()}원</span>
              </div>
            </div>

            {/* 리워드 목록 */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">리워드 선택</h3>
              {funding.rewards?.map((reward) => (
                  <div key={reward.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{reward.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                        <p className="text-teal-600 font-bold mt-2">
                          {reward.price?.toLocaleString()}원
                          {reward.shippingCharge > 0 && (
                              <span className="text-xs text-gray-400 ml-2">
                                                    +배송비 {reward.shippingCharge?.toLocaleString()}원
                                                </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          잔여 {reward.remainQty} / {reward.limitQty}개
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleQtyChange(reward.id, (selectedRewards[reward.id] || 0) - 1)}
                            className="w-8 h-8 border rounded text-lg font-bold"
                            disabled={!selectedRewards[reward.id]}
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">
                                            {selectedRewards[reward.id] || 0}
                                        </span>
                        <button
                            onClick={() => handleQtyChange(reward.id, (selectedRewards[reward.id] || 0) + 1)}
                            className="w-8 h-8 border rounded text-lg font-bold"
                            disabled={(selectedRewards[reward.id] || 0) >= reward.remainQty}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 주문 요약 */}
          <div className="border p-4 rounded-lg bg-white shadow-sm h-fit sticky top-4 space-y-4">
            <h3 className="font-bold">선택한 리워드</h3>
            {Object.keys(selectedRewards).length === 0 ? (
                <p className="text-sm text-gray-400">리워드를 선택해주세요</p>
            ) : (
                <>
                  <ul className="text-sm space-y-1">
                    {Object.entries(selectedRewards).map(([rewardId, qty]) => {
                      const reward = funding.rewards.find((r) => r.id === Number(rewardId));
                      return (
                          <li key={rewardId} className="flex justify-between">
                            <span>{reward?.name} x{qty}</span>
                            <span>{((reward?.price || 0) * qty).toLocaleString()}원</span>
                          </li>
                      );
                    })}
                  </ul>
                  <div className="border-t pt-2 flex justify-between font-bold text-teal-600">
                    <span>합계</span>
                    <span>
                                    {Object.entries(selectedRewards)
                                        .reduce((sum, [rewardId, qty]) => {
                                          const reward = funding.rewards.find((r) => r.id === Number(rewardId));
                                          return sum + ((reward?.price || 0) + (reward?.shippingCharge || 0)) * qty;
                                        }, 0)
                                        .toLocaleString()}원
                                </span>
                  </div>
                </>
            )}

            {/* 펀딩 타입 안내 */}
            <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              {isReserved
                  ? '📅 예약 펀딩: 펀딩 성공 시 자동 결제'
                  : '⚡ 즉시 펀딩: 주문 확정 시 바로 결제'}
            </p>

            <button
                onClick={handleOrder}
                disabled={Object.keys(selectedRewards).length === 0 || ordering || !isOrderable}
                className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
            >
              {ordering
                  ? '주문서 생성 중...'
                  : isScheduled
                      ? '펀딩 예정입니다'
                      : isExpired
                          ? '마감된 펀딩입니다'
                          : '주문하기'}
            </button>

            <div className="flex gap-2 mt-4">
              <button
                  onClick={() => navigate(`/fundings/${id}/chat`)}
                  className="flex-1 border border-teal-500 text-teal-500 py-2 rounded-lg font-bold hover:bg-teal-50"
              >
                💬 공개 채팅방
              </button>
              <button
                  onClick={handleInquiry}
                  className="flex-1 border border-gray-400 text-gray-600 py-2 rounded-lg font-bold hover:bg-gray-50"
              >
                📩 문의하기
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}