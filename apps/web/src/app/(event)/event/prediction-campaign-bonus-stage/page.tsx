import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return getEventPageMetadata('prediction_campaign_bonus_stage', '/event/prediction-campaign-bonus-stage');
}

export default async function Page() {
    return <PredictionCampaignModal />;
}
