import type { SearchType } from '@dimensiondev/enums';
import { useNavigate, useSearch } from '@dimensiondev/ssr';
import { useEffect } from 'react';

import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';

export default function SearchIndexPage() {
    const navigate = useNavigate();
    const searchParams = useSearch();
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') as SearchType | null;

    useEffect(() => {
        navigate(resolveSearchUrl(q, type ?? undefined), { replace: true });
    }, [navigate, q, type]);

    return null;
}
