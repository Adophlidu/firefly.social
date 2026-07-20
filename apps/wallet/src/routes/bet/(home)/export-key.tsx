import { Navigate } from '@/components/Navigate.js';
import { getModalRedirectUrl } from '@/configs/modalRoutes.js';

export default function ExportKeyRedirect() {
    return <Navigate to={getModalRedirectUrl('/bet/export-key')} />;
}
