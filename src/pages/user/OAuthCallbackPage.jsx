import { useEffect, useRef } from 'react';
import useModalStore from '../../stores/useModalStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useAuthStore from '../../stores/useAuthStore.js';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const setTokens = useAuthStore((state) => state.setTokens);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('accessToken');
    const refreshToken = hashParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      openModal({ title: '오류', message: '소셜 로그인 인증 실패했습니다.', type: 'error' });
      navigate('/login', { replace: true });
      return;
    }

    setTokens(accessToken, refreshToken);
    checkMember(accessToken);
  }, [navigate, setTokens]);

  const checkMember = async (token) => {
    try {
      await apiClient.get('/api/members/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/', { replace: true });
    } catch {
      // member 없음 → 닉네임 설정
      navigate('/social/signup', { replace: true });
    }
  };

  return <div className="p-8 text-center">인증 완료 처리 중입니다...</div>;
}