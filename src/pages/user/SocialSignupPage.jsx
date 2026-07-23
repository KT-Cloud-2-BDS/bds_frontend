import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useModalStore from "../../stores/useModalStore.js";

export default function SocialSignupPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) {
            openModal({ title: '안내', message: '닉네임을 입력해주세요.', type: 'info' });
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/members/social/signup', { nickname });
            openModal({ title: '성공', message: '가입 완료!', type: 'success' });
            navigate('/', { replace: true });
        } catch (err) {
            openModal({ title: '실패', message: (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-2 text-center">닉네임 설정</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
                소셜 로그인이 완료되었습니다. 사용할 닉네임을 입력해주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder="닉네임"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-500 text-white py-2 rounded font-bold hover:bg-teal-600 disabled:bg-gray-300 cursor-pointer"
                >
                    {loading ? '처리 중...' : '완료'}
                </button>
            </form>
        </div>
    );
}