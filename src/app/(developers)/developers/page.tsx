'use client';

import { useEffect } from 'react';

import { ToolkitList } from '@/app/(developers)/components/ToolkitList.js';
import { useRouter } from '@/esm/navigation.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';

export default function Developers() {
    const router = useRouter();
    const isSmall = useIsSmall('max');

    useEffect(() => {
        if (!isSmall) router.replace('/developers/general');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isSmall) return null;

    // mobile
    return (
        <main className="flex min-h-screen w-full">
            <ToolkitList />
        </main>
    );
}
