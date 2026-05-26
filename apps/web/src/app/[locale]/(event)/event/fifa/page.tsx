import type { Metadata } from 'next';

import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return createEventMetadata('fifa', '/event/fifa');
}

export default function Page() {
    return <WorldCupModal />;
}
