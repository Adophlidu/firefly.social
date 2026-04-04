'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

export const NoAvailableWallet = memo(function NoAvailableWallet() {
    return (
        <div className="h-[156px] leading-[18px]">
            <Trans>Sorry, there is no wallet address available for tipping.</Trans>
        </div>
    );
});
