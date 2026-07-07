import type { LayoutProps } from '@dimensiondev/types';

import { TipsDetailWithView } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/TipsDetailWithView.js';
import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { notFound } from '@/esm/navigation/server.js';
import { getTxPageData, getTxPageMetadata } from '@/helpers/getTxPageData.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';

export const revalidate = 3600;

interface Props extends LayoutProps<{ chain_id: string; hash: string }> {}

export async function generateMetadata(props: Props) {
    const { chain_id, hash } = await props.params;
    return getTxPageMetadata(Number.parseInt(chain_id, 10), hash, `/tx/${chain_id}/${hash}`);
}

export default async function Page(props: Props) {
    const { chain_id, hash } = await props.params;
    const chainId = Number(chain_id);

    if (!isValidTxId(hash)) notFound();

    const pageData = await getTxPageData(chainId, hash);
    if (pageData?.kind === 'tips') return <TipsDetailWithView tipsData={pageData.data} />;

    return <SwapDetail chainId={chainId} hash={hash} />;
}
