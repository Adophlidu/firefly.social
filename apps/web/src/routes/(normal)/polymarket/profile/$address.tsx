import { PredictionPlatform } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { PredictionProfileDetailContent } from '@/components/Prediction/PredictionProfileDetailContent.js';
import { fetchPredictionProfile } from '@/providers/firefly/prediction/fetchPredictionProfile.js';

export const config = { cache: { sMaxAge: 60 } };

interface PolymarketProfileLoaderData {
    address: string;
    predictionProfile: NonNullable<Awaited<ReturnType<typeof fetchPredictionProfile>>>;
}

export async function loader({ params }: LoaderContext): Promise<PolymarketProfileLoaderData> {
    const address = params.address!;
    if (!address || !isValidAddressEthereum(address)) notFound();

    const predictionProfile = await fetchPredictionProfile(address, PredictionPlatform.Polymarket, true);
    if (!predictionProfile) notFound();

    return { address, predictionProfile };
}

export default function PolymarketProfilePage() {
    const { address, predictionProfile } = useLoaderData<PolymarketProfileLoaderData>(
        'polymarket/profile/$address.tsx',
    );
    return (
        <PredictionProfileDetailContent
            address={address}
            platform={PredictionPlatform.Polymarket}
            predictionProfile={predictionProfile}
        />
    );
}
