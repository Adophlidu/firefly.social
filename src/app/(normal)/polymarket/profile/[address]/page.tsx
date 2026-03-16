import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends LayoutProps<{
        address: string;
    }> {}

export default async function PolymarketProfilePage(props: Props) {
    const { address } = await props.params;

    return <PredictionProfileDetailContent address={address} platform={PredictionPlatform.Polymarket} />;
}
