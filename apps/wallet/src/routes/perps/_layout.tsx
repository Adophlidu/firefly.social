import { ClientOnly } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { PerpsProvider } from '@/components/Perps/PerpsProvider.js';

export default function PerpsLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <ClientOnly>
                <PerpsProvider>{children}</PerpsProvider>
            </ClientOnly>
        </div>
    );
}
