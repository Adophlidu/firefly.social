import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';

import { BetsProfileCategoryTabs } from '@/components/Bets/BetsProfileCategoryTabs.js';
import { BetsProfileOverview } from '@/components/Bets/BetsProfileOverview.js';
import { BetsProfilePageHeader } from '@/components/Bets/BetsProfilePageHeader.js';
import { BetsProfileTabContent } from '@/components/Bets/BetsProfileTabContent.js';
import { formatOpinionProfile, formatPolymarketProfile } from '@/components/Bets/formatBetsProfile.js';
import { BetsPlatform } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getBetsPortfolio } from '@/providers/firefly/bets/getBetsPortfolio.js';
import { getProfile } from '@/providers/firefly/bets/getProfile.js';

interface Props {
    address: string;
    platform: BetsPlatform;
}

export async function BetsProfileDetailContent({ address, platform }: Props) {
    if (!address || !isValidAddressEthereum(address)) notFound();

    const [, betsProfile] = await Promise.all([
        setupLocaleForSSR(),
        runInSafeAsync(async () => {
            switch (platform) {
                case BetsPlatform.Polymarket: {
                    const profile = await getProfile(address, true);
                    return profile ? formatPolymarketProfile(profile) : undefined;
                }
                case BetsPlatform.Opinion: {
                    const res = await getBetsPortfolio([address], {
                        isProxyAddress: true,
                        platform: BetsPlatform.Opinion,
                    });
                    const profile = first(res?.result);
                    return profile ? formatOpinionProfile(profile) : undefined;
                }
                default:
                    safeUnreachable(platform);
                    return;
            }
        }),
    ]);

    if (!betsProfile) notFound();

    return (
        <div>
            <BetsProfilePageHeader pageTitle={<Trans>Bets</Trans>} />
            <BetsProfileOverview address={address} profile={betsProfile} platform={platform} />
            <BetsProfileCategoryTabs />
            <BetsProfileTabContent platform={platform} address={address} proxyAddress={betsProfile?.proxy} />
        </div>
    );
}
