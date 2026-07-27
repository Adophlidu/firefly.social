import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export async function head() {
    return fromNextMetadata(await getEventPageMetadata('polymarket_prediction3', '/event/prediction-campaign-3'));
}

export default function PredictionCampaign3Page() {
    return <PredictionCampaignModal />;
}
