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
        <section className="border-line text-main rounded-lg border px-3 py-2">
            <div
                className={classNames(
                    'flex w-full items-center justify-between gap-2',
                    children ? 'border-line border-b pb-4' : '',
                )}
            >
                <div>
                    <h2 className="text-base font-bold">{label}</h2>
                    <p className="text-medium text-second mt-1">{description}</p>
                </div>
                {headerSlot}
            </div>
            {children}
        </section>
    );
}
