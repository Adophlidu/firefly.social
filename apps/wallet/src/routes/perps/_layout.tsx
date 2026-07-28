import type { ReactNode } from 'react';

export default function PerpsLayout({ children }: { children?: ReactNode }) {
    return <div className="flex size-full min-h-0 flex-col overflow-hidden">{children}</div>;
}
