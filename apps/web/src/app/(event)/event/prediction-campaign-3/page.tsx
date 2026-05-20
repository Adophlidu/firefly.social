import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return createEventMetadata('polymarket_prediction3', '/event/prediction-campaign-3');
}

export default async function Page() {
    return <PredictionCampaignModal />;
}
