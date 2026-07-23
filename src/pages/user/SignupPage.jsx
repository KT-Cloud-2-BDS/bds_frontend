import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from "../../stores/useModalStore.js";

export default function SignupPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();

    // 입력 폼 상태
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // 진행 상태 관리
    const [isMailSent, setIsMailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);

    // 1. 이메일 인증코드 발송 (auth-service)
    const handleSendMail = async (e) => {
        if (e) e.preventDefault();
        console.log('[DEBUG] 인증 요청 버튼 클릭됨, email:', email);

        if (!email) {
            openModal({ title: '안내', message: '이메일을 입력해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/api/auths/mail', { email });
            console.log('[DEBUG] 메일 발송 성공 응답:', res);
            setIsMailSent(true);
            openModal({ title: '성공', message: '인증 코드가 이메일로 발송되었습니다.', type: 'success' });
        } catch (err) {
            console.error('[DEBUG] 메일 발송 실패 에러:', err);
            openModal({ title: '발송 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 2. 인증코드 검증 (auth-service)
    const handleVerifyCode = async (e) => {
        if (e) e.preventDefault();
        console.log('[DEBUG] 인증 확인 버튼 클릭됨, code:', verificationCode);

        if (!verificationCode) {
            openModal({ title: '안내', message: '인증코드를 입력해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/api/auths/mailCheck', { email, verificationCode });
            console.log('[DEBUG] 인증 확인 성공 응답:', res);
            setIsVerified(true);
            openModal({ title: '성공', message: '이메일 인증이 완료되었습니다.', type: 'success' });
        } catch (err) {
            console.error('[DEBUG] 인증 확인 실패 에러:', err);
            openModal({ title: '인증 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 3. 최종 회원가입 (member-service)
    const handleSignup = async (e) => {
        e.preventDefault();
        console.log('[DEBUG] 최종 회원가입 제출 시도');

        if (!isVerified) {
            openModal({ title: '안내', message: '이메일 인증을 완료해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/api/members/signup', {
                email,
                password,
                nickname,
            });
            console.log('[DEBUG] 회원가입 성공 응답:', res);
            openModal({ title: '성공', message: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.', type: 'success' });
            navigate('/login');
        } catch (err) {
            console.error('[DEBUG] 회원가입 실패 에러:', err);
            openModal({ title: '회원가입 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
            <form onSubmit={handleSignup} className="space-y-4">
                {/* 이메일 입력 및 인증 버튼 */}
                <div>
                    <label className="block text-sm font-medium mb-1">이메일</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isVerified}
                            className="flex-1 border p-2 rounded disabled:bg-gray-100"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleSendMail}
                            disabled={isMailSent || loading}
                            className="bg-gray-800 text-white px-3 py-2 rounded text-sm disabled:bg-gray-400 cursor-pointer"
                        >
                            {isMailSent ? '발송됨' : '인증 요청'}
                        </button>
                    </div>
                </div>

                {/* 인증코드 입력 영역 */}
                {isMailSent && (
                    <div>
                        <label className="block text-sm font-medium mb-1">인증코드</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={verificationCode}
                                disabled={isVerified}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="flex-1 border p-2 rounded"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleVerifyCode}
                                disabled={loading || isVerified}
                                className="bg-teal-500 text-white px-3 py-2 rounded text-sm hover:bg-teal-600 cursor-pointer"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}

                {/* 닉네임 입력 */}
                <div>
                    <label className="block text-sm font-medium mb-1">닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                {/* 비밀번호 입력 */}
                <div>
                    <label className="block text-sm font-medium mb-1">비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isVerified || loading}
                    className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300 cursor-pointer"
                >
                    회원가입 완료
                </button>
            </form>

            <div className="mt-4 text-center text-sm">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="text-teal-600 font-bold">
                    로그인
                </Link>
            </div>
        </div>
    );
}