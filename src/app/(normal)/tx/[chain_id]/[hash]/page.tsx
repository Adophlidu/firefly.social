import { isHash } from 'viem';

import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { TipsDetail } from '@/components/Tips/TipsDetail.js';
import { KeyType, TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataTx } from '@/helpers/createMetadataTx.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataTx, {
    key: KeyType.CreateMetadataTx,
});

interface Props
    extends NextPageProps<
        { chain_id: string; hash: string },
        {
            view?: TipsDetailViewType;
        }
    > {}

export async function generateMetadata(props: Props) {
    const { chain_id, hash } = await props.params;
    const searchParams = await props.searchParams;
    const view = searchParams?.view ?? TipsDetailViewType.Sender;
    return createPageMetadata(`/tx/${chain_id}/${hash}`, hash, Number(chain_id), view);
}

export default async function Page(props: Props) {
    const { chain_id, hash } = await props.params;

    const params = await props.searchParams;
    const view = params?.view ?? TipsDetailViewType.Sender;
    const chainId = Number(chain_id);

    if (!isHash(hash)) notFound();

    const tipsData = await runInSafeAsync(() =>
        FireflyEndpointProvider.getTipsTransactionDetail(hash, TipsNotificationType.Tip),
    );
    if (tipsData) {
        return <TipsDetail tipsData={tipsData} view={view} />;
    }

    const swapData = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (swapData) {
        return <SwapDetail activity={swapData} />;
    }

    notFound();
}
