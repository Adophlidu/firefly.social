'use client';
import { memo, useContext } from 'react';

import { TokenContext } from '@/components/Token/TokenContext.js';
import { TokenMarketData, type TokenMarketDataProps } from '@/components/TokenProfile/TokenMarketData.js';
import { useSearchParams } from '@/esm/navigation.js';

export const WrapTokenMarketData = memo(function WrapTokenMarketData(props: TokenMarketDataProps) {
    const search = useSearchParams();
    const chainId = search.get('chainId') ? Number(search.get('chainId')) : undefined;
    const { tradeRecords } = useContext(TokenContext);
    return <TokenMarketData tradeRecords={tradeRecords} chainId={chainId} {...props} />;
});
