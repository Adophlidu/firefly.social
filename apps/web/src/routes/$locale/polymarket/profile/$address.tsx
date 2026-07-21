import { PredictionPlatform } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';

export const config = { cache: { sMaxAge: 60 } };

export default function PolymarketProfilePage() {
    const { address } = useParams();
    return <PredictionProfileDetailContent address={address!} platform={PredictionPlatform.Polymarket} />;
}
