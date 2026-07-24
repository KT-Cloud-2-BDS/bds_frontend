import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useModalStore from "../../stores/useModalStore.js";

export default function LoginPage() {
    const { openModal } = useModalStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setTokens = useAuthStore((state) => state.setTokens);
  const navigate = useNavigate();

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/api/auths/login', { email, password });
      const { accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
      openModal({ title: '로그인 성공', message: '로그인 성공했습니다.', type: 'success' });
      navigate('/');
    } catch (err) {
      openModal({ title: '로그인 실패', message:  (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const handleNaverLogin = () => {
    // 게이트웨이를 통해 OAuth2 인가 요청
    window.location.href = '/oauth2/authorization/naver';
  };

  return (
      <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>

        <form onSubmit={handleLocalLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="example@email.com"
                required
            />
          </div>
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
              className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 cursor-pointer"
          >
            로그인
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t" />
          <span className="px-3 text-sm text-gray-400">또는</span>
          <div className="flex-1 border-t" />
        </div>

        {/* 네이버 로그인 */}
        <button
            onClick={handleNaverLogin}
            className="w-full bg-[#03C75A] text-white py-2 rounded font-bold hover:bg-[#02b351] cursor-pointer"
        >
          네이버로 로그인
        </button>

        {/* 회원가입 링크 */}
        <div className="mt-4 text-center text-sm">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-teal-600 font-bold">
            회원가입
          </Link>
        </div>
          <div className="mt-2 text-center text-sm">
              비밀번호를 잊으셨나요?{' '}
              <Link to="/reset-password" className="text-gray-500 underline">
                  비밀번호 재설정
              </Link>
          </div>
      </div>
  );
}