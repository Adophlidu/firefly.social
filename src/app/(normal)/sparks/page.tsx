import type { Metadata } from 'next';

import { SparksModal } from '@/components/Sparks/SparksModal.js';
import { createSparksMetadata } from '@/providers/firefly/metadata/createSparksMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ accountId: string }> {}

export async function generateMetadata(): Promise<Metadata> {
    return createSparksMetadata();
}

export default async function SparksPage(props: Props) {
    const { accountId } = await props.params;
    return <SparksModal uid={accountId} />;
}
