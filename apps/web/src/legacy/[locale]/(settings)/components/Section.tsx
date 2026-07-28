import { classNames } from '@dimensiondev/utils';
import type { HTMLProps, ReactNode } from 'react';

import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { PageHeader } from '@/legacy/[locale]/(settings)/components/PageHeader.js';

interface SettingsSectionProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    title: ReactNode;
    enableBack?: boolean;
}

export function SettingsSection({ className, title, enableBack, children }: SettingsSectionProps) {
    const isLarge = useIsLarge('max');

    return (
        <div className={classNames('w-full px-6 pb-6', className)}>
            <PageHeader enableBack={enableBack || isLarge} hideHeadInMobile={false}>
                {title}
            </PageHeader>
            <div className="mt-3 flex w-full flex-col items-center gap-6">{children}</div>
        </div>
    );
}
