// src/pages/MyPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useModalStore from "../../stores/useModalStore.js";

export default function MyPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();
    const logout = useAuthStore((state) => state.logout);

    const [userInfo, setUserInfo] = useState(null);
    const [nickname, setNickname] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // 내 정보 조회
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await apiClient.get('/api/members/info');
                setUserInfo(res.data);
                setNickname(res.data.nickname);
            } catch (err) {
                openModal({ title: '정보 조회 실패', message: (err.response?.data?.message || err.message), type: 'error' });
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [navigate]);

    // 닉네임 수정
    const handleUpdateNickname = async () => {
        if (!nickname.trim()) {
            openModal({ title: '안내', message: '닉네임을 입력해주세요.', type: 'info' });
            return;
        }

        try {
            await apiClient.patch('/api/members/info', { nickname });
            setUserInfo((prev) => ({ ...prev, nickname }));
            setIsEditing(false);
            openModal({ title: '성공', message: '닉네임이 수정되었습니다.', type: 'success' });
        } catch (err) {
            openModal({ title: '수정 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        }
    };

    // 회원 탈퇴
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            '정말 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        );
        if (!confirmed) return;

        try {
            await apiClient.delete('/api/members/delete');
            openModal({ title: '성공', message: '회원 탈퇴가 완료되었습니다.', type: 'success' });
            logout();
            navigate('/');
        } catch (err) {
            openModal({ title: '탈퇴 실패', message: (err.response?.data?.message || err.message), type: 'error' });
        }
    };

    if (loading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-6 text-center">마이페이지</h2>

            {userInfo && (
                <div className="space-y-4">
                    {/* 이메일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
                        <p className="border p-2 rounded bg-gray-50">{userInfo.email}</p>
                    </div>

                    {/* 닉네임 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">닉네임</label>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="flex-1 border p-2 rounded"
                                />
                                <button
                                    onClick={handleUpdateNickname}
                                    className="bg-teal-500 text-white px-3 py-2 rounded text-sm hover:bg-teal-600"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => {
                                        setNickname(userInfo.nickname);
                                        setIsEditing(false);
                                    }}
                                    className="bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
                                >
                                    취소
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <p className="flex-1 border p-2 rounded bg-gray-50">{userInfo.nickname}</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-900"
                                >
                                    수정
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 구분선 */}
                    <hr className="my-6" />

                    {/* 회원 탈퇴 */}
                    <div className="text-center">
                        <button
                            onClick={handleDeleteAccount}
                            className="text-red-500 text-sm underline hover:text-red-700"
                        >
                            회원 탈퇴
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}