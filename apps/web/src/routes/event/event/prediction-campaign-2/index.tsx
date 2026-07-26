import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export function head() {
    return getEventPageMetadata('polymarket_prediction2', '/event/prediction-campaign-2');
}

export default function PredictionCampaign2Page() {
    return <PredictionCampaignModal />;
}
