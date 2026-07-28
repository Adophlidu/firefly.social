import type { ReactNode } from 'react';

interface SwatchProps {
    label: string;
    children: ReactNode;
}

export function Swatch({ label, children }: SwatchProps) {
    return (
        <div className="flex flex-col items-start gap-2">
            <div className="flex min-h-12 items-center">{children}</div>
            <span className="text-xs text-second">{label}</span>
        </div>
    );
}
