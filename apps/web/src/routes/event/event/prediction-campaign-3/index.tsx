import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export function head() {
    return getEventPageMetadata('polymarket_prediction3', '/event/prediction-campaign-3');
}

export default function PredictionCampaign3Page() {
    return <PredictionCampaignModal />;
}
