import { Suspense } from 'react';

import { PerpetualsPage } from '@/components/Perps/PerpetualsPage.js';
import { PerpetualsSkeleton } from '@/components/Perps/PerpetualsSkeleton.js';
import { PerpsClientProvider } from '@/components/Perps/PerpsClientProvider.js';

export default function Page() {
    return (
        <PerpsClientProvider>
            <Suspense fallback={<PerpetualsSkeleton />}>
                <PerpetualsPage />
            </Suspense>
        </PerpsClientProvider>
    );
}
