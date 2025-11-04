import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { TipsDetail } from '@/components/Tips/TipsDetail.js';
import { TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { fireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<
        { chain_id: string; hash: string },
        {
            view?: TipsDetailViewType;
        }
    > {}

export async function generateMetadata(props: Props) {
    const { chain_id, hash } = await props.params;
    return fireflyMetadataProvider.createTransactionMetadata(
        Number.parseInt(chain_id, 10),
        hash,
        `/tx/${chain_id}/${hash}`,
    );
}

export default async function Page(props: Props) {
    const { chain_id, hash } = await props.params;

    const params = await props.searchParams;
    const view = params?.view ?? TipsDetailViewType.Sender;
    const chainId = Number(chain_id);

    if (!isValidTxId(hash)) notFound();

    const tipsData = await runInSafeAsync(() =>
        fireflyEndpointProvider.getTipsTransactionDetail(hash, TipsNotificationType.Tip),
    );
    if (tipsData) return <TipsDetail tipsData={tipsData} view={view} />;

    const swapData = await runInSafeAsync(() => fireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (swapData) return <SwapDetail activity={swapData} />;

    notFound();
}
