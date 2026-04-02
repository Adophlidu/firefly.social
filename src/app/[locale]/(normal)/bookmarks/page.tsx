'use client';

import { useEffect } from 'react';

import { DEFAULT_BOOKMARK_SOURCE } from '@/constants/computed.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';

export default function Page() {
    const router = useRouter();
    useEffect(() => {
        router.replace(resolveBookmarkUrl(DEFAULT_BOOKMARK_SOURCE));
    }, [router]);
    return null;
}
