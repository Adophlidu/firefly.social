import { type Metadata } from 'next';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionProfileMetadata } from '@/providers/firefly/metadata/createPredictionProfileMetadata.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { address } = await props.params;
    return createPredictionProfileMetadata(address, PredictionPlatform.Opinion, `/opinion/profile/${address}`);
}

export default async function OpinionProfilePage(props: Props) {
    const { address } = await props.params;

    return <PredictionProfileDetailContent address={address} platform={PredictionPlatform.Opinion} />;
}
