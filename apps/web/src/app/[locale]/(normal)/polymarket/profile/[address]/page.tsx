import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { fetchPredictionProfile } from '@/providers/firefly/prediction/fetchPredictionProfile.js';

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
    if (!address || !isValidAddressEthereum(address)) notFound();

    const predictionProfile = await fetchPredictionProfile(address, PredictionPlatform.Polymarket, true);
    if (!predictionProfile) notFound();

    return (
        <PredictionProfileDetailContent
            address={address}
            platform={PredictionPlatform.Polymarket}
            predictionProfile={predictionProfile}
        />
    );
}
