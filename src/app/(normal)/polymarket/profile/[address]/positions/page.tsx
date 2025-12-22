import { PolymarketPositionList } from '@/components/Polymarket/PolymarketPositionList.js';
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

export default async function PolymarketProfilePositionsPage(props: Props) {
    const { address } = await props.params;
    if (!address || !isValidAddressEthereum(address)) notFound();

    await setupLocaleForSSR();
    const polymarketProfile = await runInSafeAsync(() => getProfile(address));

    return <PolymarketPositionList address={address} proxyAddress={polymarketProfile?.proxy} />;
}
