import type { Metadata } from 'next';

import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageData.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return getEventPageMetadata('polymarket_prediction2', '/event/prediction-campaign-2');
}

export default function Page() {
    return <PredictionCampaignModal />;
}
