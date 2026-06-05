import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { createEventMetadata } from '@/providers/firefly/metadata/createEventMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return createEventMetadata('prediction_campaign_bonus_stage', '/event/prediction-campaign-bonus-stage');
}

export default function Page() {
    return <PredictionCampaignModal />;
}
