import type { PropsWithChildren } from 'react';

import { classNames } from '@/helpers/classNames.js';

export function ContentCard({
    label,
    description,
    headerSlot,
    children,
}: PropsWithChildren<{
    label: React.ReactNode;
    description: React.ReactNode;
    headerSlot?: React.ReactNode;
}>) {
    return (
        <section className="rounded-lg border border-line px-3 py-2 text-main">
            <div className={classNames('flex w-full items-center gap-2', children ? 'border-b border-line pb-4' : '')}>
                <div>
                    <h1 className="text-base font-bold">{label}</h1>
                    <p className="mt-1 text-medium text-second">{description}</p>
                </div>
                {headerSlot}
            </div>
            {children}
        </section>
    );
}
