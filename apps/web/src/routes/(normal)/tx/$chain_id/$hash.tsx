import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';

import { TipsDetailWithView } from '@/legacy/[locale]/(normal)/tx/[chain_id]/[hash]/TipsDetailWithView.js';
import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { getTransactionPageData } from '@/providers/firefly/metadata/getTransactionPageData.js';
import { getTransactionPageMetadata } from '@/providers/firefly/metadata/getTransactionPageMetadata.js';

export const config = { cache: { sMaxAge: 3600 } };

interface TxLoaderData {
    chainId: number;
    hash: string;
    tipsData: Parameters<typeof TipsDetailWithView>[0]['tipsData'] | null;
}

export async function loader({ params }: LoaderContext): Promise<TxLoaderData> {
    const chainId = Number(params.chain_id);
    const hash = params.hash!;
    if (!isValidTxId(hash)) notFound();

    const pageData = await getTransactionPageData(chainId, hash);
    return {
        chainId,
        hash,
        tipsData: pageData?.kind === 'tips' ? pageData.data : null,
    };
}

export async function head({ params }: HeadContext) {
    const { chain_id, hash } = params;
    return fromNextMetadata(
        await getTransactionPageMetadata(Number.parseInt(chain_id ?? '', 10), hash ?? '', `/tx/${chain_id}/${hash}`),
    );
}

export default function TxPage() {
    const { chainId, hash, tipsData } = useLoaderData<TxLoaderData>();
    if (tipsData) return <TipsDetailWithView tipsData={tipsData} />;
    return <SwapDetail chainId={chainId} hash={hash} />;
}
