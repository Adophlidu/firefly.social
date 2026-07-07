import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';

export const revalidate = 60;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

interface Props extends LayoutProps<{
    address: string;
}> {}

export default async function PolymarketProfilePage(props: Props) {
    const { address } = await props.params;

    return <PredictionProfileDetailContent address={address} platform={PredictionPlatform.Polymarket} />;
}
