import { Navigate } from '@/components/Navigate.js';
import { RoutePath } from '@/components/SendTransactionModal/types.js';

export default function SendIndexRedirect() {
    return <Navigate to={RoutePath.SelectToken} replace />;
}
