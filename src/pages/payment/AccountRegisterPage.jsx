import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from "../../api/apiClient.js";
import useModalStore from "../../stores/useModalStore.js";

const BANK_CODES = [
    { code: '004', name: 'KB국민은행' },
    { code: '088', name: '신한은행' },
    { code: '020', name: '우리은행' },
    { code: '081', name: '하나은행' },
    { code: '011', name: 'NH농협은행' },
    { code: '003', name: 'IBK기업은행' },
    { code: '090', name: '카카오뱅크' },
    { code: '092', name: '토스뱅크' },
];

export default function AccountRegisterPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();

    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [verifyCode, setVerifyCode] = useState('');

    const [step, setStep] = useState(1); // 1: 계좌입력, 2: 인증코드 입력
    const [loading, setLoading] = useState(false);

    // 1단계: 계좌 등록 요청 (POST /api/payment/accounts)
    const handleRegister = async () => {
        if (!bankCode || !accountNumber || !holderName) {
            openModal({ title: '안내', message: '은행, 계좌번호, 예금주명을 모두 입력해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/payment/accounts', {
                bankCode,
                accountNumber,
                holderName,
            });
            setStep(2);
            openModal({ title: '성공', message: '1원이 입금되었습니다. 입금자명에 적힌 인증코드를 입력해주세요.', type: 'success' });
        } catch (err) {
            openModal({ title: '계좌 등록 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 2단계: 인증코드 확인 (POST /api/payment/accounts/verify)
    const handleVerify = async () => {
        if (!verifyCode) {
            openModal({ title: '안내', message: '인증코드를 입력해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/payment/accounts/verify', {
                code: verifyCode,
            });
            openModal({ title: '성공', message: '계좌 연결이 완료되었습니다!', type: 'success' });
            navigate('/wallet');
        } catch (err) {
            openModal({ title: '인증 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 space-y-6 mt-8">
            <div>
                <Link to="/wallet" className="text-sm text-gray-400 hover:text-gray-600">← 월렛으로</Link>
                <h2 className="text-2xl font-bold mt-2">계좌 연결</h2>
            </div>

            {/* Step 1: 계좌 입력 */}
            <div className="border rounded-lg p-4 bg-white space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">은행 선택</label>
                    <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        disabled={step === 2}
                        className="w-full border p-2 rounded disabled:bg-gray-100"
                    >
                        <option value="">은행을 선택해주세요</option>
                        {BANK_CODES.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                                {bank.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">계좌번호</label>
                    <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        disabled={step === 2}
                        placeholder="'-' 없이 숫자만 입력"
                        className="w-full border p-2 rounded disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">예금주명</label>
                    <input
                        type="text"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        disabled={step === 2}
                        placeholder="예금주명 입력"
                        className="w-full border p-2 rounded disabled:bg-gray-100"
                    />
                </div>

                {step === 1 && (
                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
                    >
                        {loading ? '처리 중...' : '1원 인증 요청'}
                    </button>
                )}
            </div>

            {/* Step 2: 인증코드 입력 */}
            {step === 2 && (
                <div className="border rounded-lg p-4 bg-white space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                        💡 입금된 1원의 입금자명에 적힌 인증코드를 입력해주세요.
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">인증코드</label>
                        <input
                            type="text"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            placeholder="인증코드 입력"
                            className="w-full border p-2 rounded"
                        />
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:bg-gray-300"
                    >
                        {loading ? '확인 중...' : '인증 확인'}
                    </button>
                </div>
            )}
        </div>
    );
}