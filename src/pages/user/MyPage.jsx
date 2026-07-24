import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useModalStore from "../../stores/useModalStore.js";
import {parseJwt} from "../../utils/parseJwt.js";

export default function MyPage() {
    const navigate = useNavigate();
    const { openModal } = useModalStore();
    const logout = useAuthStore((state) => state.logout);

    const [userInfo, setUserInfo] = useState(null);
    const [nickname, setNickname] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // 비밀번호 변경
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 내 정보 조회
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await apiClient.get('/api/members/info');

                // JWT에서 email, role 추출
                const token = localStorage.getItem('accessToken');
                const payload = parseJwt(token);


                setUserInfo({
                    ...res.data,
                    email: payload?.email || '',
                    roles: payload?.roles || '',
                });

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

    // 비밀번호 변경
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            openModal({ title: '안내', message: '새 비밀번호가 일치하지 않습니다.', type: 'info' });
            return;
        }
        try {
            await apiClient.patch('/api/auths/me/password', { currentPassword, newPassword });
            openModal({ title: '성공', message: '비밀번호가 변경되었습니다.', type: 'success' });
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            openModal({ title: '실패', message: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    // 역할 전환
    const handleSwitchRole = async () => {
        try {
            const res = await apiClient.patch('/api/auths/role');

            const refreshToken = localStorage.getItem('refreshToken');
            const tokenRes = await apiClient.post('/api/auths/token/refresh', { refreshToken });
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = tokenRes.data;
            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

            const newRole = res.data.role;
            openModal({
                title: '성공',
                message: `역할이 ${newRole === 'CREATOR' ? '크리에이터' : '서포터'}로 전환되었습니다.`,
                type: 'success',
            });
            setUserInfo((prev) => ({ ...prev, roles: [newRole] }));
        } catch (err) {
            openModal({ title: '실패', message: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    useEffect(() => {
        console.log(userInfo);
    },[userInfo])


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


                    {/* 역할 전환 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">현재 역할</label>
                        <div className="flex gap-2 items-center">
                            <p className="flex-1 border p-2 rounded bg-gray-50">
                                {userInfo.roles?.includes('MAKER')  ? '🎨 창작자' : '💪 서포터'}
                            </p>
                            <button
                                onClick={handleSwitchRole}
                                className="bg-indigo-500 text-white px-3 py-2 rounded text-sm hover:bg-indigo-600 cursor-pointer"
                            >
                                {userInfo.roles?.includes('MAKER')  ? '서포터로 전환' : '창작자로 전환'}
                            </button>
                        </div>
                    </div>

                    <hr className="my-4" />

                    {/* 비밀번호 변경 */}
                    {!showPasswordForm ? (
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="w-full border border-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-50 cursor-pointer"
                        >
                            비밀번호 변경
                        </button>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-3 p-4 border rounded bg-gray-50">
                            <h3 className="font-bold text-sm">비밀번호 변경</h3>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="현재 비밀번호"
                                className="w-full border p-2 rounded text-sm"
                                required
                            />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호"
                                className="w-full border p-2 rounded text-sm"
                                required
                            />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호 확인"
                                className="w-full border p-2 rounded text-sm"
                                required
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-teal-500 text-white py-2 rounded text-sm cursor-pointer">변경</button>
                                <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 bg-gray-300 py-2 rounded text-sm cursor-pointer">취소</button>
                            </div>
                        </form>
                    )}


                    {/* 구분선 */}
                    <hr className="my-4" />

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