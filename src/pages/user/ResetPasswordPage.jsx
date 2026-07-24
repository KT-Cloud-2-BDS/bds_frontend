import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import useModalStore from '../../stores/useModalStore';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();

    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [step, setStep] = useState(1); // 1: 이메일, 2: 인증코드, 3: 새 비밀번호
    const [loading, setLoading] = useState(false);

    // 1단계: 인증코드 발송
    const handleSendMail = async () => {
        if (!email) {
            openModal({ title: '안내', message: '이메일을 입력해주세요.', type: 'info' });
            return;
        }
        setLoading(true);
        try {
            await apiClient.post('/api/auths/password/mail', { email });
            openModal({ title: '성공', message: '인증 코드가 발송되었습니다.', type: 'success' });
            setStep(2);
        } catch (err) {
            openModal({ title: '실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 2단계: 인증코드 확인
    const handleVerifyCode = async () => {
        if (!verificationCode) {
            openModal({ title: '안내', message: '인증코드를 입력해주세요.', type: 'info' });
            return;
        }
        setLoading(true);
        try {
            await apiClient.post('/api/auths/password/mailCheck', { email, verificationCode });
            openModal({ title: '성공', message: '인증이 완료되었습니다.', type: 'success' });
            setStep(3);
        } catch (err) {
            openModal({ title: '실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 3단계: 새 비밀번호 설정
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            openModal({ title: '안내', message: '비밀번호가 일치하지 않습니다.', type: 'info' });
            return;
        }
        setLoading(true);
        try {
            await apiClient.patch('/api/auths/password', { email, newPassword });
            openModal({ title: '성공', message: '비밀번호가 재설정되었습니다. 로그인해주세요.', type: 'success' });
            navigate('/login');
        } catch (err) {
            openModal({ title: '실패', message: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-6 text-center">비밀번호 재설정</h2>

            {/* Step 1: 이메일 입력 */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="가입한 이메일을 입력하세요"
                        />
                    </div>
                    <button
                        onClick={handleSendMail}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300 cursor-pointer"
                    >
                        {loading ? '발송 중...' : '인증코드 발송'}
                    </button>
                </div>
            )}

            {/* Step 2: 인증코드 입력 */}
            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">{email}로 인증코드가 발송되었습니다.</p>
                    <div>
                        <label className="block text-sm font-medium mb-1">인증코드</label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="인증코드 입력"
                        />
                    </div>
                    <button
                        onClick={handleVerifyCode}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300 cursor-pointer"
                    >
                        {loading ? '확인 중...' : '인증 확인'}
                    </button>
                </div>
            )}

            {/* Step 3: 새 비밀번호 */}
            {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">새 비밀번호</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300 cursor-pointer"
                    >
                        {loading ? '처리 중...' : '비밀번호 재설정'}
                    </button>
                </form>
            )}

            <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-teal-600 font-bold">로그인으로 돌아가기</Link>
            </div>
        </div>
    );
}