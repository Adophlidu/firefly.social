'use client';

import ComebackIcon from '@dimensiondev/assets/comeback.svg';
import { PageRoute } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import type { PropsWithChildren } from 'react';

import { useComeBack } from '@/hooks/useComeback.js';
import { Headline } from '@/legacy/[locale]/(settings)/components/Headline.js';

type PageHeaderProps = PropsWithChildren<{
    enableBack?: boolean;
    hideHeadInMobile?: boolean;
}>;

export function PageHeader({ enableBack, hideHeadInMobile, children }: PageHeaderProps) {
    const comeback = useComeBack(PageRoute.Settings);

    return (
        <header
            className={classNames(
                'sticky top-0 z-10 w-full bg-primaryBottom pb-3 pt-6',
                enableBack ? 'flex items-center gap-6' : '',
            )}
        >
            {enableBack ? <ComebackIcon onClick={comeback} className="cursor-pointer" width={24} height={24} /> : null}
            <Headline hideInMobile={hideHeadInMobile}>{children}</Headline>
        </header>
    );
}
