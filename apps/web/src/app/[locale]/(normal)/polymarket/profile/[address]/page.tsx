import { type LayoutProps } from '@dimensiondev/types';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';

export const revalidate = 60;

interface Props
    extends LayoutProps<{
        address: string;
    }> {}

export default async function PolymarketProfilePage(props: Props) {
    const { address } = await props.params;

    return <PredictionProfileDetailContent address={address} platform={PredictionPlatform.Polymarket} />;
}
