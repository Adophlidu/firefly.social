import { Navigate } from '@/components/Navigate.js';
import { getModalRedirectUrl } from '@/configs/modalRoutes.js';

export default function DepositViaCryptoRedirect() {
    return <Navigate to={getModalRedirectUrl('/bet/deposit-via-crypto')} />;
}
