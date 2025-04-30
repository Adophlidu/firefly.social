'use client';

import { Trans } from '@lingui/react/macro';
import React, { memo, useState } from 'react';

import CloseIcon from '@/assets/close.svg';
import { SITE_URL_OFFICIAL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';

export const DomainMigrationNotification = memo(function DomainMigrationNotification() {
    const [closed, setClosed] = useState(bom.location ? /\.?firefly\.social$/.test(bom.location.hostname) : true);

    const handleClose = () => {
        setClosed(true);
    };

    if (closed) return null;

    return (
        <div className="fixed inset-0 top-[30px] z-[9999] m-auto mt-0 box-border flex h-16 w-[397px] items-center gap-3 rounded-2xl bg-primaryBottom p-4 shadow-[0px_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_30px_rgba(255,255,255,0.15)]">
            <p className="shrink-0 whitespace-nowrap text-sm font-normal text-main">
                <Trans>
                    ✨ We&apos;ve moved to{' '}
                    <a className="text-highlight" href={SITE_URL_OFFICIAL}>
                        firefly.social
                    </a>
                </Trans>
            </p>
            <a
                href={SITE_URL_OFFICIAL}
                className="mr-2 shrink-0 whitespace-nowrap rounded-full bg-main px-3 py-2 text-xs font-bold text-primaryBottom no-underline"
            >
                <Trans>Take me there</Trans>
            </a>
            <CloseIcon className="shrink-0 cursor-pointer text-main" width={18} height={18} onClick={handleClose} />
        </div>
    );
});
