import type { LayoutProps } from '@dimensiondev/types';

import { TipsDetailWithView } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/TipsDetailWithView.js';
import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { getTransactionPageData } from '@/providers/firefly/metadata/getTransactionPageData.js';
import { getTransactionPageMetadata } from '@/providers/firefly/metadata/getTransactionPageMetadata.js';

export const revalidate = 3600;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

interface Props extends LayoutProps<{ chain_id: string; hash: string }> {}

export async function generateMetadata(props: Props) {
    const { chain_id, hash } = await props.params;
    return getTransactionPageMetadata(Number.parseInt(chain_id, 10), hash, `/tx/${chain_id}/${hash}`);
}

export default async function Page(props: Props) {
    const { chain_id, hash } = await props.params;
    const chainId = Number(chain_id);

    if (!isValidTxId(hash)) notFound();

    const pageData = await getTransactionPageData(chainId, hash);
    if (pageData?.kind === 'tips') return <TipsDetailWithView tipsData={pageData.data} />;

    return <SwapDetail chainId={chainId} hash={hash} />;
}
