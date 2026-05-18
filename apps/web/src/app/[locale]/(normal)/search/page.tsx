'use client';

import type { SearchType } from '@dimensiondev/enums';
import { useSearchParams } from 'next/navigation.js';
import { useEffect } from 'react';

import { useRouter } from '@/esm/navigation.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') as SearchType | null;

    useEffect(() => {
        router.replace(resolveSearchUrl(q, type ?? undefined));
    }, [router, q, type]);

    return null;
}
