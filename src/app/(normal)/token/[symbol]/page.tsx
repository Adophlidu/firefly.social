import { TokenDetail } from '@/components/TokenProfile/TokenDetail.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataToken } from '@/helpers/createMetadataToken.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataToken, {
    key: KeyType.CreateMetadataToken,
});

interface Props
    extends NextPageProps<
        { symbol: string },
        {
            isSymbol?: string;
        }
    > {}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    return createPageMetadata(params.symbol);
}

export default async function TokenPage(props: Props) {
    const { symbol } = await props.params;
    const { isSymbol } = await props.searchParams;
    return <TokenDetail symbol={symbol} isCoinId={isSymbol !== 'true'} />;
}
