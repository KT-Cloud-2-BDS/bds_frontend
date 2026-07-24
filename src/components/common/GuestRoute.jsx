import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';

export default function GuestRoute({ children }) {
    const accessToken = useAuthStore((state) => state.accessToken);

    if (accessToken) {
        return <Navigate to="/" replace />;
    }

    return children;
}