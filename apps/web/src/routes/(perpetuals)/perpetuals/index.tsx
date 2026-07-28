import { notFound } from '@dimensiondev/ssr';
import { Suspense } from 'react';

import { PerpetualsPage } from '@/components/Perps/PerpetualsPage.js';
import { PerpetualsSkeleton } from '@/components/Perps/PerpetualsSkeleton.js';
import { PerpsClientProvider } from '@/components/Perps/PerpsClientProvider.js';
import { FEATURE_FLAGS } from '@/constants/featureFlags.js';

export function loader(): void {
    if (!FEATURE_FLAGS.perpetuals) notFound();
}

export default function Page() {
    return (
        <PerpsClientProvider>
            <Suspense fallback={<PerpetualsSkeleton />}>
                <PerpetualsPage />
            </Suspense>
        </PerpsClientProvider>
    );
}
