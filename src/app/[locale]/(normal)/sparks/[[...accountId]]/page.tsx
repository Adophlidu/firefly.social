import { SparksModal } from '@/components/Sparks/SparksModal.js';
import { createSparksAccountMetadata } from '@/providers/firefly/metadata/createSparksAccountMetadata.js';
import { createSparksMetadata } from '@/providers/firefly/metadata/createSparksMetadata.js';
import { type LayoutProps } from '@/types/utility.js';

export const revalidate = 300;

interface Props extends LayoutProps<{ slug?: string[] }> {}

export async function generateMetadata(props: Props) {
    const { slug } = await props.params;
    if (!slug?.length) return createSparksMetadata();
    const accountId = slug[0];
    return createSparksAccountMetadata(accountId, `/sparks/${accountId}`);
}

export default async function SparksModalPage(props: Props) {
    return <SparksModal />;
}
