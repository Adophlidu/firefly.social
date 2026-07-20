import { Navigate } from '@/components/Navigate.js';
import { getModalRedirectUrl } from '@/configs/modalRoutes.js';

export default function ReceiveRedirect() {
    return <Navigate to={getModalRedirectUrl('/receive')} />;
}
