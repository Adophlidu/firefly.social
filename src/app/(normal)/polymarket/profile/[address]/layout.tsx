import { Trans } from '@lingui/react/macro';

import { ProfileCategoryTabs } from '@/app/(normal)/polymarket/profile/[address]/ProfileCategoryTabs.js';
import { PolymarketPageHeader } from '@/components/Polymarket/PolymarketPageHeader.js';
import { PolymarketProfileOverview } from '@/components/Polymarket/PolymarketProfileOverview.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getProfile } from '@/providers/firefly/bets/getProfile.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function PolymarketProfileLayout(props: Props) {
    const { address } = await props.params;
    if (!address || !isValidAddressEthereum(address)) notFound();

    const [, polymarketProfile] = await Promise.all([setupLocaleForSSR(), runInSafeAsync(() => getProfile(address))]);

    return (
        <div>
            <PolymarketPageHeader pageTitle={<Trans>Bets</Trans>} />
            <PolymarketProfileOverview address={address} profile={polymarketProfile} />
            <ProfileCategoryTabs address={address} />
            {props.children}
        </div>
    );
}
