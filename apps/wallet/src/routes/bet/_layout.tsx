import type { ReactNode } from 'react';

import { V2UpgradeCheck } from '@/components/Bet/V2UpgradeCheck.js';

export default function BetLayout({ children }: { children?: ReactNode }) {
    return <V2UpgradeCheck>{children}</V2UpgradeCheck>;
}
