import { DEFAULT_BOOKMARK_SOURCE } from '@dimensiondev/constants/computed';
import { useEffect } from 'react';

import { useRouter } from '@/esm/navigation.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';

export default function Page() {
    const router = useRouter();
    useEffect(() => {
        router.replace(resolveBookmarkUrl(DEFAULT_BOOKMARK_SOURCE));
    }, [router]);
    return null;
}
