import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from "../../stores/useModalStore.js";

export default function WalletPage() {
    const { openModal } = useModalStore();

    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [depositing, setDepositing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/payments/wallet');
            setWallet(res.data);
        } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 500) {
                setWallet(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWallet = async () => {
        setCreating(true);
        try {
            const res = await apiClient.post('/api/payments/wallet');
            setWallet(res.data);
            openModal({ title: '완료', message: '월렛이 생성되었습니다!', type: 'success' });
        } catch (err) {
            openModal({ title: '실패', message: '월렛 생성 실패: ' + (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleDeposit = async () => {
        const amount = Number(depositAmount);
        if (!amount || amount <= 0) {
            openModal({ title: '입력 오류', message: '충전할 금액을 입력해주세요.', type: 'warning' });
            return;
        }
        setDepositing(true);
        try {
            await apiClient.post('/api/payments/deposit', { amount });
            openModal({ title: '충전 완료', message: `${amount.toLocaleString()}원이 충전되었습니다.`, type: 'success' });
            setDepositAmount('');
            fetchWallet();
        } catch (err) {
            openModal({ title: '충전 실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setDepositing(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0) {
            openModal({ title: '입력 오류', message: '출금할 금액을 입력해주세요.', type: 'warning' });
            return;
        }
        setWithdrawing(true);
        try {
            await apiClient.post('/api/payments/withdraw', { amount });
            openModal({ title: '출금 완료', message: `${amount.toLocaleString()}원이 출금되었습니다.`, type: 'success' });
            setWithdrawAmount('');
            fetchWallet();
        } catch (err) {
            openModal({ title: '출금 실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setWithdrawing(false);
        }
    };

    const hasAccount = !!wallet?.accountNumber;

    if (loading) return <div className="text-center py-12">로딩 중...</div>;

    // 월렛 없음 → 생성 유도
    if (!wallet) {
        return (
            <div className="max-w-md mx-auto p-6 text-center space-y-6 mt-12">
                <div className="text-6xl">💰</div>
                <h2 className="text-2xl font-bold">월렛이 없습니다</h2>
                <p className="text-gray-600">
                    펀딩 결제를 위해 월렛을 먼저 만들어주세요.
                </p>
                <button
                    onClick={handleCreateWallet}
                    disabled={creating}
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
                >
                    {creating ? '생성 중...' : '월렛 만들기'}
                </button>
                <Link to="/" className="block text-sm text-gray-400 hover:text-gray-600">
                    ← 홈으로
                </Link>
            </div>
        );
    }

    // 월렛 있음
    return (
        <div className="max-w-md mx-auto p-6 space-y-6 mt-8">
            <h2 className="text-2xl font-bold">💰 내 월렛</h2>

            {/* 잔고 표시 */}
            <div className="border rounded-xl p-6 bg-gradient-to-br from-teal-50 to-white shadow-sm text-center">
                <p className="text-sm text-gray-500 mb-2">보유 잔고</p>
                <p className="text-4xl font-black text-teal-600">
                    {wallet.balance?.toLocaleString()}원
                </p>
            </div>

            {/* 계좌 관리 (항상 표시) */}
            <div className="border rounded-lg p-4 bg-white space-y-3">
                <h3 className="font-bold">연결 계좌</h3>
                {hasAccount ? (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                            {wallet.bankCode && `[${wallet.bankCode}] `}{wallet.accountNumber}
                        </span>
                        <span className="text-teal-600 font-medium">연결됨</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-700">
                            ⚠️ 계좌를 연결해야 충전 및 결제가 가능합니다.
                        </div>
                        <Link
                            to="/wallet/account"
                            className="block text-center border-dashed border-2 border-teal-400 text-teal-600 py-3 rounded font-bold hover:bg-teal-50"
                        >
                            + 계좌 연결하기
                        </Link>
                    </>
                )}
            </div>

            {/* 충전: 계좌 연결된 경우에만 표시 */}
            {/*{hasAccount && (*/}
                <div className="border rounded-lg p-4 bg-white space-y-3">
                    <h3 className="font-bold">잔고 충전</h3>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="충전할 금액 입력"
                            className="flex-1 border p-2 rounded"
                        />
                        <button
                            onClick={handleDeposit}
                            disabled={depositing}
                            className="bg-teal-500 text-white px-4 py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300"
                        >
                            {depositing ? '...' : '충전'}
                        </button>
                    </div>
                    {/* 빠른 충전 버튼 */}
                    <div className="flex gap-2">
                        {[10000, 50000, 100000].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setDepositAmount(String(amt))}
                                className="flex-1 border border-teal-300 text-teal-600 py-1 rounded text-sm hover:bg-teal-50"
                            >
                                +{(amt / 10000).toFixed(0)}만원
                            </button>
                        ))}
                    </div>
                </div>
            {/*)}*/}

            {/* 출금: 계좌 연결된 경우에만 표시 */}
            {/*{hasAccount && (*/}
                <div className="border rounded-lg p-4 bg-white space-y-3">
                    <h3 className="font-bold">출금 (내 계좌로 보내기)</h3>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="출금할 금액 입력"
                            className="flex-1 border p-2 rounded"
                        />
                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawing}
                            className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 disabled:bg-gray-300"
                        >
                            {withdrawing ? '...' : '출금'}
                        </button>
                    </div>
                </div>
            {/*)}*/}

            {/* 거래 내역 링크 */}
            <Link
                to="/wallet/history"
                className="block text-center border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
            >
                거래 내역 보기
            </Link>
        </div>
    );
}