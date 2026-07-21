import type { ReactNode } from 'react';

interface SectionProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
    return (
        <section className="mb-14">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-second">{description}</p> : null}
            <div className="mt-5 flex flex-wrap items-start gap-4 rounded-2xl border border-line bg-bg p-6">
                {children}
            </div>
        </section>
    );
}
