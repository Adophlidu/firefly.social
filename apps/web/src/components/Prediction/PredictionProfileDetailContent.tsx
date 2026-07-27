import type { PredictionPlatform } from '@dimensiondev/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { PredictionProfileCategoryTabs } from '@/components/Prediction/PredictionProfileCategoryTabs.js';
import { PredictionProfileOverview } from '@/components/Prediction/PredictionProfileOverview.js';
import { PredictionProfilePageHeader } from '@/components/Prediction/PredictionProfilePageHeader.js';
import { PredictionProfileTabContent } from '@/components/Prediction/PredictionProfileTabContent.js';
import type { fetchPredictionProfile } from '@/providers/firefly/prediction/fetchPredictionProfile.js';

interface Props {
    address: string;
    platform: PredictionPlatform;
    /** Fetched by the route loader (async client components are not
        renderable outside RSC — data fetching belongs in loaders). */
    predictionProfile: NonNullable<Awaited<ReturnType<typeof fetchPredictionProfile>>>;
}

export function PredictionProfileDetailContent({ address, platform, predictionProfile }: Props) {
    if (!address || !isValidAddressEthereum(address)) return null;

    return (
        <div>
            <PredictionProfilePageHeader
                address={address}
                platform={platform}
                fallbackName={predictionProfile.platform_name}
            />
            <PredictionProfileOverview address={address} profile={predictionProfile} platform={platform} />
            <PredictionProfileCategoryTabs />
            <PredictionProfileTabContent platform={platform} address={address} predictionProfile={predictionProfile} />
        </div>
    );
}
