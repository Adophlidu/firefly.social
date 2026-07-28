import { Suspense } from 'react';

import { PerpetualsPage } from '@/components/Perps/PerpetualsPage.js';
import { PerpetualsSkeleton } from '@/components/Perps/PerpetualsSkeleton.js';
import { PerpsClientProvider } from '@/components/Perps/PerpsClientProvider.js';
import { FEATURE_FLAGS } from '@/constants/featureFlags.js';
import { notFound } from '@/esm/navigation/server.js';

export default function Page() {
    if (!FEATURE_FLAGS.perpetuals) notFound();

    return (
        <PerpsClientProvider>
            <Suspense fallback={<PerpetualsSkeleton />}>
                <PerpetualsPage />
            </Suspense>
        </PerpsClientProvider>
    );
}
