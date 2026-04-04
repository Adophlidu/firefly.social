'use client';

import ComebackIcon from '@dimensiondev/assets/comeback.svg';
import { classNames } from '@dimensiondev/utils';
import { type PropsWithChildren } from 'react';

import { Headline } from '@/app/[locale]/(settings)/components/Headline.js';
import { PageRoute } from '@/constants/enum.js';
import { useComeBack } from '@/hooks/useComeback.js';

type PageHeaderProps = PropsWithChildren<{
    enableBack?: boolean;
    hideHeadInMobile?: boolean;
}>;

export function PageHeader({ enableBack, hideHeadInMobile, children }: PageHeaderProps) {
    const comeback = useComeBack(PageRoute.Settings);

    return (
        <header
            className={classNames(
                'bg-primaryBottom sticky top-0 z-10 w-full pb-3 pt-6',
                enableBack ? 'flex items-center gap-6' : '',
            )}
        >
            {enableBack ? <ComebackIcon onClick={comeback} className="cursor-pointer" width={24} height={24} /> : null}
            <Headline hideInMobile={hideHeadInMobile}>{children}</Headline>
        </header>
    );
}
