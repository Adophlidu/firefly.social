import { type PropsWithChildren } from 'react';

import { PrivyReadyBanner } from '@/components/PrivyReadyBanner.js';

export function PrivyReadyRequired({ children }: PropsWithChildren) {
    return <PrivyReadyBanner>{children}</PrivyReadyBanner>;
}
