'use client';

import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

export function VirtualListFooterBottomText({ text }: { text?: ReactNode }) {
    return (
        <div className="text-secondary flex items-center justify-center p-6 text-base">
            {text ?? <Trans>You&#39;ve hit rock bottom.</Trans>}
        </div>
    );
}
