import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useModalStore from './stores/useModalStore';
import Modal from './components/common/Modal';
import Header from './components/layout/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';

import HomePage from './pages/HomePage';
import FundingListPage from './pages/funding/FundingListPage.jsx';
import FundingDetailPage from './pages/funding/FundingDetailPage.jsx';
import BillingPage from './pages/order/BillingPage.jsx';
import OrderPayResultPage from './pages/order/OrderPayResultPage.jsx';
import OrderCancelResultPage from './pages/order/OrderCancelResultPage.jsx';
import MyOrdersPage from './pages/order/MyOrdersPage.jsx';
import OrderDetailPage from './pages/order/OrderDetailPage.jsx';
import WalletPage from './pages/payment/WalletPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import MyPage from './pages/user/MyPage.jsx';
import LoginPage from './pages/user/LoginPage.jsx';
import SignupPage from './pages/user/SignupPage.jsx';
import OAuthCallbackPage from './pages/user/OAuthCallbackPage.jsx';
import SocialSignupPage from './pages/user/SocialSignupPage.jsx';
import WalletHistoryPage from './pages/payment/WalletHistoryPage.jsx';
import AccountRegisterPage from "./pages/payment/AccountRegisterPage.jsx";
import OrderReservedResultPage from "./pages/order/OrderReservedResultPage.jsx";
import FundingChatPage from './pages/funding/FundingChatPage';
import InquiryChatPage from './pages/chat/InquiryChatPage';
import InquiryListPage from "./pages/chat/InquiryListPage.jsx";


export default function App() {
    const { isOpen, title, message, type, confirmText, cancelText, onConfirm, onCancel, closeModal } = useModalStore();

    return (
        <BrowserRouter>
            <Header />
            <Routes>
                {/* 누구나 접근 가능 */}
                <Route path="/" element={<HomePage />} />
                <Route path="/fundings/list" element={<FundingListPage />} />
                <Route path="/fundings/:id" element={<FundingDetailPage />} />

                {/* 비로그인만 접근 가능 */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/social/signup" element={<SocialSignupPage />} />

                {/* 로그인 필수 */}
                <Route path="/fundings/:fundingId/billing/:orderId" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/order/pay-result" element={<ProtectedRoute><OrderPayResultPage /></ProtectedRoute>} />
                <Route path="/order/cancel-result" element={<ProtectedRoute><OrderCancelResultPage /></ProtectedRoute>} />
                <Route path="/order/reserved-result" element={<ProtectedRoute><OrderReservedResultPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                <Route path="/wallet/history" element={<ProtectedRoute><WalletHistoryPage /></ProtectedRoute>} />
                <Route path="/wallet/account" element={<ProtectedRoute><AccountRegisterPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
                <Route path="/fundings/:id/chat" element={<ProtectedRoute><FundingChatPage /></ProtectedRoute>} />
                <Route path="/chat/inquiries/:roomId" element={<ProtectedRoute><InquiryChatPage /></ProtectedRoute>} />
                <Route path="/chat/inquiries" element={<ProtectedRoute><InquiryListPage /></ProtectedRoute>} />
            </Routes>

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                title={title}
                message={message}
                type={type}
                confirmText={confirmText}
                cancelText={cancelText}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        </BrowserRouter>
    );
}