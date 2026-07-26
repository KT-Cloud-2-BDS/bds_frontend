import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';

export default function Header() {
    const navigate = useNavigate();
    const { accessToken, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };


    return (
        <header className="border-b p-4 flex justify-between items-center max-w-5xl mx-auto">
            <Link to="/" className="text-2xl font-black text-teal-500">빵디즈</Link>
            <nav className="flex gap-4 text-sm font-medium items-center">
                {accessToken ? (
                    <>
                        <Link to="/fundings/create" className="text-gray-600 hover:text-teal-600">🚀 펀딩 만들기</Link>
                        <Link to="/notifications" className="text-gray-600 hover:text-teal-600">🔔 알림</Link>
                        <Link to="/wallet" className="text-gray-600 hover:text-teal-600">💰 월렛</Link>
                        <Link to="/orders" className="text-gray-600 hover:text-teal-600">내 주문</Link>
                        <Link to="/chat/inquiries" className="text-gray-600 hover:text-teal-600">💬 채팅</Link>
                        <Link to="/mypage" className="text-gray-600 hover:text-teal-600">마이페이지</Link>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 cursor-pointer">
                            로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="text-gray-600">로그인</Link>
                        <Link to="/signup" className="text-teal-600 font-bold">회원가입</Link>
                    </>
                )}
            </nav>
        </header>
    );
}