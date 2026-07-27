import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { PredictionCampaignModal } from '@/components/PredictionCampaign/PredictionCampaignModal.js';
import { getEventPageMetadata } from '@/providers/firefly/metadata/getEventPageMetadata.js';

export async function head() {
    return fromNextMetadata(
        await getEventPageMetadata('prediction_campaign_bonus_stage', '/event/prediction-campaign-bonus-stage'),
    );
}

export default function PredictionCampaignBonusStagePage() {
    return <PredictionCampaignModal />;
}
