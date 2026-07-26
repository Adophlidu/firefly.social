import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export async function head() {
    return fromNextMetadata(await getEventPageMetadata('polymarket_prediction2', '/event/prediction-campaign-2'));
}

export default function PredictionCampaign2Page() {
    return <PredictionCampaignModal />;
}
