import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';
import { type LayoutProps } from '@/types/utility.js';

export const dynamic = 'force-dynamic';

interface Props extends LayoutProps<{ name: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { name } = await props.params;
    return createEventMetadata(name, `/event/${name}`);
}

export default function Page() {
    return <PredictionCampaignModal />;
}
