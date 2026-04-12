import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { PredictionPlatform } from '@/constants/enum.js';
import { createPredictionEventMetadata } from '@/providers/firefly/metadata/createPredictionEventMetadata.js';

interface Props
    extends LayoutProps<{
        id: string;
    }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    return createPredictionEventMetadata(id, PredictionPlatform.Polymarket, `/polymarket/event/${id}`);
}

export default async function PolymarketEventLayout(props: Props) {
    return props.children;
}
