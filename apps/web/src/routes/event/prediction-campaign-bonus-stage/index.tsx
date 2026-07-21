import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export function head() {
    return getEventPageMetadata('prediction_campaign_bonus_stage', '/event/prediction-campaign-bonus-stage');
}

export default function PredictionCampaignBonusStagePage() {
    return <PredictionCampaignModal />;
}
