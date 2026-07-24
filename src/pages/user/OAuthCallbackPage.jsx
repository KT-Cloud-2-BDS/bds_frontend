import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import useAuthStore from '../../stores/useAuthStore';
import useModalStore from '../../stores/useModalStore';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const setTokens = useAuthStore((state) => state.setTokens);
  const processed = useRef(false);

  const checkMember = async (token) => {
    try {
      await apiClient.get('/api/members/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/', { replace: true });
    } catch {
      navigate('/social/signup', { replace: true });
    }
  };

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('accessToken');
    const refreshToken = hashParams.get('refreshToken');
    const error = hashParams.get('error');

    // 주소창에서 토큰 제거
    window.history.replaceState(null, '', window.location.pathname);

    if (error) {
      openModal({ title: '오류', message: '소셜 로그인에 실패했습니다.', type: 'error' });
      navigate('/login', { replace: true });
      return;
    }

    if (!accessToken || !refreshToken) {
      openModal({ title: '오류', message: '소셜 로그인 인증 실패했습니다.', type: 'error' });
      navigate('/login', { replace: true });
      return;
    }

    setTokens(accessToken, refreshToken);
    checkMember(accessToken);
  }, [navigate, setTokens]);

  return <div className="p-8 text-center">인증 완료 처리 중입니다...</div>;
}