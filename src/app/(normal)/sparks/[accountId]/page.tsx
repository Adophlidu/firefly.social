import { SparksModal } from '@/components/Sparks/SparksModal.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ accountId: string }> {}

export async function generateMetadata(props: Props) {
    const { accountId } = await props.params;
    return fireflyMetadataProvider.createSparksAccountMetadata(accountId, `/sparks/${accountId}`);
}

export default async function SparksModalPage(props: Props) {
    const { accountId } = await props.params;
    return <SparksModal uid={accountId} />;
}
