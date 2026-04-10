import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const name = 'prediction-campaign-2';
    return createEventMetadata(name, `/event/${name}`, 'polymarket_prediction2');
}

export default async function Page() {
    return <PredictionCampaignModal />;
}
