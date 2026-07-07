import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageData.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return getEventPageMetadata('polymarket_prediction3', '/event/prediction-campaign-3');
}

export default async function Page() {
    return <PredictionCampaignModal />;
}
