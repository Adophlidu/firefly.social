import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionProfileMetadata } from '@/providers/firefly/metadata/createPredictionProfileMetadata.js';

interface Props
    extends LayoutProps<{
        address: string;
    }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { address } = await props.params;
    return createPredictionProfileMetadata(address, PredictionPlatform.Polymarket, `/polymarket/profile/${address}`);
}

export default async function PolymarketProfileLayout(props: Props) {
    return props.children;
}
