import type { Metadata } from 'next';

import { SparksModal } from '@/components/Sparks/SparksModal.js';
import { createSparksMetadata } from '@/providers/firefly/metadata/createSparksMetadata.js';

export async function generateMetadata(): Promise<Metadata> {
    return createSparksMetadata();
}

export default async function SparksPage() {
    return <SparksModal />;
}
