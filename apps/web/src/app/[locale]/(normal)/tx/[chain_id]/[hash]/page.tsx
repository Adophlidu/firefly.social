import { type LayoutProps } from '@dimensiondev/types';

import { TipsDetailWithView } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/TipsDetailWithView.js';
import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { TipsNotificationType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import { createTransactionMetadata } from '@/providers/firefly/metadata/createTransactionMetadata.js';

export const revalidate = 3600;

interface Props extends LayoutProps<{ chain_id: string; hash: string }> {}

export async function generateMetadata(props: Props) {
    const { chain_id, hash } = await props.params;
    return createTransactionMetadata(Number.parseInt(chain_id, 10), hash, `/tx/${chain_id}/${hash}`);
}

export default async function Page(props: Props) {
    const { chain_id, hash } = await props.params;
    const chainId = Number(chain_id);

    if (!isValidTxId(hash)) notFound();

    const tipsData = await runInSafeAsync(() => getTipsTransactionDetail(hash, TipsNotificationType.Tip));
    if (tipsData) return <TipsDetailWithView tipsData={tipsData} />;

    return <SwapDetail chainId={chainId} hash={hash} />;
}
