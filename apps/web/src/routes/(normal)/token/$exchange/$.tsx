import { TokenCategory } from '@dimensiondev/enums';
import { useParams, useSearch } from '@dimensiondev/ssr';
import { useMemo } from 'react';

import { Feeds } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/categories/Feeds.js';
import { Transactions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/categories/Transactions.js';
import TokenPageLoading from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/loading.js';
import { TokenOverview } from '@/components/TokenProfile/TokenOverview/index.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

/**
 * The hook accepts plain values (promises created during render suspend
 * forever on mount retry — React #482).
 */
export default function TokenCategoryPage() {
    const params = useParams();
    const searchParams = useSearch();

    const pageProps = useMemo(() => {
        const mapped = {
            exchange: params.exchange ?? '',
            slug: (params['*'] ? params['*'].split('/') : undefined) as never,
        };
        const mappedSearch: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            mappedSearch[key] = value;
        });
        return { params: mapped, searchParams: mappedSearch as never };
    }, [params, searchParams]);

    const {
        addressSlug,
        category,
        coinChainId,
        isCex,
        isDex,
        isPending,
        isTokenPending,
        slug,
        token,
        tokenAddress,
        tokenId,
        trader,
        traderName,
        updatedChainId,
    } = useTokenPageParams(pageProps);

    switch (category) {
        case TokenCategory.Feeds:
            if (isTokenPending && !tokenAddress) return <TokenPageLoading />;
            return (
                <Feeds
                    chainId={updatedChainId}
                    address={tokenAddress}
                    symbol={token?.symbol || (isCex ? slug[0] : isDex ? addressSlug : undefined) || ''}
                    name={token?.name}
                />
            );
        case TokenCategory.About:
            return <TokenOverview coinId={tokenId} chainId={updatedChainId} address={tokenAddress} className="pb-20" />;
        case TokenCategory.Transactions:
        default:
            if ((isTokenPending || tokenId) && isPending && !tokenAddress) return <TokenPageLoading />;
            const txChainId = tokenId && !updatedChainId && !tokenAddress ? coinChainId : updatedChainId;
            return (
                <Transactions chainId={txChainId} tokenAddress={tokenAddress} trader={trader} traderName={traderName} />
            );
    }
}
