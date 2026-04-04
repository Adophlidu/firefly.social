import { type Metadata } from 'next';

import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionProfileMetadata } from '@/providers/firefly/metadata/createPredictionProfileMetadata.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends LayoutProps<{
        address: string;
    }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { address } = await props.params;
    return createPredictionProfileMetadata(address, PredictionPlatform.Opinion, `/opinion/profile/${address}`);
}
export default async function OpinionProfileLayout(props: Props) {
    return props.children;
}
