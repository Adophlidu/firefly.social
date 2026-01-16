import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { BetsPlatform } from '@/constants/enum.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function OpinionProfilePage(props: Props) {
    const { address } = await props.params;

    return <PredictionProfileDetailContent address={address} platform={BetsPlatform.Opinion} />;
}
