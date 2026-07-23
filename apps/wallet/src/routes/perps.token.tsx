import { createFileRoute, Navigate, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/perps/token')({
    component: PerpsTokenPage,
});

interface PerpsTokenSearch {
    token?: string;
}

function PerpsTokenPage() {
    const search = useSearch({ from: '/perps/token' }) as PerpsTokenSearch;
    return <Navigate to="/perps" search={{ token: search.token || 'BTC' }} replace />;
}
