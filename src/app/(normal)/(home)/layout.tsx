import type { PropsWithChildren } from 'react';

import { HomeTabs } from '@/components/HomeTab/index.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Layout({ children }: PropsWithChildren) {
    return (
        <div className="flex w-full flex-col">
            <HomeTabs />
            <NoSSR>{children}</NoSSR>
        </div>
    );
}
