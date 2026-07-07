import type { LayoutProps } from '@dimensiondev/types';
import { headers } from 'next/headers.js';
import { notFound, redirect, RedirectType } from 'next/navigation.js';
import type { PropsWithChildren } from 'react';

import { CategoryTabs } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/CategoryTabs.js';
import {
    getTokenDetailPageData,
    getTokenDetailPageMetadata,
} from '@/providers/firefly/metadata/getTokenDetailPageData.js';
import { MobileSwapButton } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/MobileSwapButton.js';
import { resolveTokenDetailQueryOptions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/resolveTokenDetailQueryOptions.js';
import { WrapTokenMarketData } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';

type Props = LayoutProps<{
    exchange: string;
    slug?: string[] | undefined;
}>;

/** Layouts never receive searchParams; the proxy forwards the query via X-SEARCH-PARAMS. */
async function getForwardedSearch() {
    const rawSearch = (await headers()).get('X-SEARCH-PARAMS') || '';
    return { rawSearch, search: rawSearch ? new URLSearchParams(rawSearch) : null };
}

function updateSearch(originSearch: string, patch: Record<string, string>) {
    const newSearch = new URLSearchParams(originSearch);
    newSearch.delete('isCoinId');

    for (const [key, value] of new URLSearchParams(patch).entries()) {
        newSearch.set(key, value);
    }

    return newSearch.size ? `?${newSearch.toString()}` : '';
}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    const { search } = await getForwardedSearch();
    const query = resolveTokenDetailQueryOptions(params.exchange, params.slug, search);
    const keyword = query.isCexCoin ? query.coingecko_id : query.isDexCoin ? query.address : query.legacySymbol;

    return getTokenDetailPageMetadata(
        query.token_symbol,
        query.coingecko_id,
        query.chain_id,
        query.address,
        query.pathname,
        keyword ?? '-',
        {
            chainId: query.chain_id,
            address: query.address,
            isCoinId: query.isCexCoin ? true : query.isCoinId,
        },
    );
}

/**
 * Legacy route:
 *  - /token/[symbol or address]/[category]
 * New route:
 *  - /token/cex/[coingecko_id]
 *  - /token/dex/[chain_id]/[address]
 */
export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    const params = await props.params;
    const legacySymbol = decodeURIComponent(params.exchange).replace(/^\$/, '');
    const { rawSearch, search } = await getForwardedSearch();

    // legacy search param
    const isCoinId = search?.get('isCoinId') === 'true';
    const isCexCoin = legacySymbol === 'cex';
    const isDexCoin = legacySymbol === 'dex';
    const isNewRoute = isCexCoin || isDexCoin;
    const slugs = params.slug || [];
    const slug = slugs[0]; // category of legacy, or coingecko_id of new

    const newSearch = !isNewRoute
        ? updateSearch(rawSearch, slug ? { category: slug } : {})
        : rawSearch
          ? `?${rawSearch}`
          : '';

    if (!isNewRoute && isCoinId) {
        redirect(`/token/cex/${legacySymbol}${newSearch}`);
    }

    const query = resolveTokenDetailQueryOptions(params.exchange, params.slug, search);
    const pageData = await getTokenDetailPageData(
        query.token_symbol,
        query.coingecko_id,
        query.chain_id,
        query.address,
    );

    if (!pageData) notFound();

    const { token, tokenQueryOptions, initialTrending } = pageData;

    if (!isNewRoute) {
        const url = token.id
            ? `/token/cex/${token.id}${newSearch}`
            : `/token/dex/${query.chain_id || token.chainId}/${query.address || token.address}${newSearch}`;
        redirect(url, RedirectType.replace);
    }

    return (
        <TokenContextProvider token={token} tokenQueryOptions={tokenQueryOptions} initialTrending={initialTrending}>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black uppercase text-lightMain">
                        {token?.symbol || (isNewRoute ? slug : legacySymbol)}
                    </span>
                </div>
                <MobileSwapButton className="ml-auto flex !gap-2 whitespace-nowrap !px-4 font-bold" token={token} />
            </div>
            <WrapTokenMarketData className="sticky" token={token} />
            <CategoryTabs token={token} className="sticky top-[54px] !z-30 md:top-[60px]" />
            <div className="flex grow flex-col p-3">{props.children}</div>
        </TokenContextProvider>
    );
}
