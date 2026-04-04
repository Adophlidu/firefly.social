'use client';

import SideTokensSkeleton from '@/components/Token/AsideTokensSkeleton.js';
import { dynamic } from '@/esm/dynamic.js';

const BookmarkedTokens = dynamic(() => import('@/components/Token/BookmarkedTokens.js'), {
    ssr: false,
    loading: () => <SideTokensSkeleton loginRequired />,
});
const AsideTrendingTokens = dynamic(() => import('@/components/Token/AsideTrendingTokens.js'), {
    ssr: false,
    loading: () => <SideTokensSkeleton />,
});

export default function Page() {
    return (
        <div className="mt-[26px] flex flex-col gap-6">
            <BookmarkedTokens />
            <AsideTrendingTokens />
        </div>
    );
}
