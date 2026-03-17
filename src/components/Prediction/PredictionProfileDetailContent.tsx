import { PredictionProfileCategoryTabs } from '@/components/Prediction/PredictionProfileCategoryTabs.js';
import { PredictionProfileOverview } from '@/components/Prediction/PredictionProfileOverview.js';
import { PredictionProfilePageHeader } from '@/components/Prediction/PredictionProfilePageHeader.js';
import { PredictionProfileTabContent } from '@/components/Prediction/PredictionProfileTabContent.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { fetchPredictionProfile } from '@/providers/firefly/prediction/fetchPredictionProfile.js';

interface Props {
    address: string;
    platform: PredictionPlatform;
}

export async function PredictionProfileDetailContent({ address, platform }: Props) {
    if (!address || !isValidAddressEthereum(address)) notFound();

    const [, predictionProfile] = await Promise.all([
        setupLocaleForSSR(),
        fetchPredictionProfile(address, platform, true),
    ]);

    if (!predictionProfile) notFound();

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
