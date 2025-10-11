import { Trans } from '@lingui/react/macro';

import { PolymarketPageHeader } from '@/components/Polymarket/PolymarketPageHeader.js';
import { PolymarketTradeList } from '@/components/Polymarket/PolymarketTradeList.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function PolymarketProfileTradesPage(props: Props) {
    const { address } = await props.params;
    if (!address || !isValidAddressEthereum(address)) notFound();

    await setupLocaleForSSR();

    return (
        <div className="min-h-screen">
            <PolymarketPageHeader pageTitle={<Trans>Trades</Trans>} />
            <PolymarketTradeList address={address} />
        </div>
    );
}
