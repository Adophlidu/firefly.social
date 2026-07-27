import type { ReactNode } from 'react';

import { HomeTabs } from '@/components/HomeTab/index.js';

/**
 * The (home) group frame (the old (normal)/(home)/layout.tsx): HomeTabs above
 * the home feeds — posts/activities/prediction/world-cup-feed/following.
 * Membership is directory-based; there are intentionally no pathname checks.
 */
export default function HomeGroupLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="flex w-full flex-col">
            <HomeTabs />
            {children}
        </div>
    );
}
