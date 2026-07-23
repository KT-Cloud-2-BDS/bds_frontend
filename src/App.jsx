import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useModalStore from './stores/useModalStore';
import Modal from './components/common/Modal';
import Header from './components/layout/Header';
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


export default function App() {
    const { isOpen, title, message, type, confirmText, cancelText, onConfirm, onCancel, closeModal } = useModalStore();

    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/fundings/list" element={<FundingListPage />} />
                <Route path="/fundings/:id" element={<FundingDetailPage />} />
                <Route path="/fundings/:fundingId/billing/:orderId" element={<BillingPage />} />
                <Route path="/order/pay-result" element={<OrderPayResultPage />} />
                <Route path="/order/cancel-result" element={<OrderCancelResultPage />} />
                <Route path="/orders" element={<MyOrdersPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/social/signup" element={<SocialSignupPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/wallet/history" element={<WalletHistoryPage />} />
                <Route path="/wallet/account" element={<AccountRegisterPage />} />
                <Route path="/order/reserved-result" element={<OrderReservedResultPage />} />
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