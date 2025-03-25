import { SwapDetail } from '@/components/Swap/SwapDetail.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataSwap } from '@/helpers/createMetadataSwap.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataSwap, {
    key: KeyType.CreateMetadataSwap,
});

interface Props extends NextPageProps<{ hash: string; chainId: string }> {}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    return createPageMetadata(params.hash, Number(params.chainId));
}

export default async function SwapPage(props: Props) {
    const { hash, chainId } = await props.params;
    return <SwapDetail hash={hash} chainId={Number(chainId)} />;
}
