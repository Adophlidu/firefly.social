import { useEffect } from 'react';

import { useNavigate, useSearch } from '@dimensiondev/ssr';

import { parseSearchParams } from '@/helpers/searchParams.js';

export default PerpsTokenPage;
interface PerpsTokenSearch {
    token?: string;
}

function PerpsTokenPage() {
    const navigate = useNavigate();
    const search = parseSearchParams(useSearch()) as PerpsTokenSearch;

    useEffect(() => {
        navigate(`/perps?token=${encodeURIComponent(search.token || 'BTC')}`, { replace: true });
    }, [navigate, search.token]);

    return null;
}
