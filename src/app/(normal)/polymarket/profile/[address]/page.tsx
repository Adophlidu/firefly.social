import { Trans } from '@lingui/react/macro';

import { PolymarketPageHeader } from '@/components/Polymarket/PolymarketPageHeader.js';
import { PolymarketProfileOverview } from '@/components/Polymarket/PolymarketProfileOverview.js';
import { PolymarketProfilePosition } from '@/components/Polymarket/PolymarketProfilePosition.js';
import { PolymarketProfileTrades } from '@/components/Polymarket/PolymarketProfileTrades.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function PolymarketProfilePage(props: Props) {
    const { address } = await props.params;
    if (!address || !isValidAddressEthereum(address)) notFound();

    await setupLocaleForSSR();
    const polymarketProfile = await runInSafeAsync(() => fireflyEndpointProvider.getPolymarketProfile(address));

    return (
        <div>
            <PolymarketPageHeader pageTitle={<Trans>Bets</Trans>} />
            <PolymarketProfileOverview address={address} data={polymarketProfile} />
            <PolymarketProfilePosition address={address} proxyAddress={polymarketProfile?.proxy} />
            <PolymarketProfileTrades address={address} />
        </div>
    );
}
