import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';

export default function WalletHistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/payment/history')
            .then((res) => setHistory(res.data?.content || res.data || []))
            .catch((err) => console.error('거래 내역 조회 실패:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-12">로딩 중...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6">
                <Link to="/wallet" className="text-sm text-gray-400 hover:text-gray-600">← 월렛으로</Link>
                <h2 className="text-2xl font-bold mt-2">거래 내역</h2>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-16 text-gray-400">거래 내역이 없습니다.</div>
            ) : (
                <div className="space-y-2">
                    {history.map((item, idx) => (
                        <div key={item.id || idx} className="border rounded-lg p-4 bg-white flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{item.description || item.reason}</p>
                                <p className="text-xs text-gray-400">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : ''}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${
                                    ['CHARGE', 'FUNDING_REFUND', 'SETTLEMENT'].includes(item.type)
                                        ? 'text-teal-600'
                                        : 'text-red-500'
                                }`}>
                                    {['CHARGE', 'FUNDING_REFUND', 'SETTLEMENT'].includes(item.type) ? '+' : '-'}
                                    {item.amount?.toLocaleString()}원
                                </p>
                                <p className="text-xs text-gray-400">잔액 {item.balanceAfter?.toLocaleString()}원</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}