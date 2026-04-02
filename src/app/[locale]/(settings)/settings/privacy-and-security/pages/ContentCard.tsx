import { classNames } from '@dimensiondev/utils';
import { type PropsWithChildren, type ReactNode } from 'react';

export function ContentCard({
    label,
    description,
    headerSlot,
    children,
}: PropsWithChildren<{
    label: ReactNode;
    description: ReactNode;
    headerSlot?: ReactNode;
}>) {
    return (
        <section className="rounded-lg border border-line px-3 py-2 text-main">
            <div
                className={classNames(
                    'flex w-full items-center justify-between gap-2',
                    children ? 'border-b border-line pb-4' : '',
                )}
            >
                <div>
                    <h2 className="text-base font-bold">{label}</h2>
                    <p className="mt-1 text-medium text-second">{description}</p>
                </div>
                {headerSlot}
            </div>
            {children}
        </section>
    );
}
