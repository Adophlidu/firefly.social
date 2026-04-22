import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return createEventMetadata('polymarket_prediction2', '/event/prediction-campaign-2');
}

export default function Page() {
    return <PredictionCampaignModal />;
}
