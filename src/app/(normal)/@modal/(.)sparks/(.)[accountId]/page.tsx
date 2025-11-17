import { SparksModal } from '@/components/Sparks/SparksModal.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ accountId: string }> {}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function SparksModalPage(props: Props) {
    const { accountId } = await props.params;
    return <SparksModal uid={accountId} />;
}
