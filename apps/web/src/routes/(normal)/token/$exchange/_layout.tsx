import { type LoaderContext, notFound, redirect, useLoaderData, useParams, useSearch } from '@dimensiondev/ssr';
import { type ReactNode, useMemo } from 'react';

import { CategoryTabs } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/CategoryTabs.js';
import { MobileSwapButton } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/MobileSwapButton.js';
import { resolveTokenDetailQueryOptions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/resolveTokenDetailQueryOptions.js';
import { WrapTokenMarketData } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { TokenOverview } from '@/components/TokenProfile/TokenOverview/index.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';
import { getTokenDetailPageData } from '@/providers/firefly/metadata/getTokenDetailPageData.js';

/** The token info card in the right column (the old @sidebar/token route). */
export function sidebar() {
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

    const { tokenAddress, tokenId, updatedChainId, isPending, isTokenPending } = useTokenPageParams(pageProps);

    return (
        <div className="flex flex-col pb-6">
            <TokenOverview
                loading={isPending || isTokenPending}
                coinId={tokenId}
                chainId={updatedChainId}
                address={tokenAddress}
                className="mt-3"
            />
        </div>
    );
}

/** Renders its own header and no compose affordance. */
export const topnav = () => null;
export const compose = () => null;

function updateSearch(originSearch: string, patch: Record<string, string>) {
    const newSearch = new URLSearchParams(originSearch);
    newSearch.delete('isCoinId');

    for (const [key, value] of new URLSearchParams(patch).entries()) {
        newSearch.set(key, value);
    }

    return newSearch.size ? `?${newSearch.toString()}` : '';
}

type TokenDetailPageData = NonNullable<Awaited<ReturnType<typeof getTokenDetailPageData>>>;

interface TokenLayoutData extends TokenDetailPageData {
    slug: string;
}

/**
 * Port of the Next token layout
 * (src/app/[locale]/(normal)/token/[exchange]/[[...slug]]/layout.tsx):
 * legacy URLs redirect to the canonical routes; canonical routes render the
 * token chrome (header, market data, category tabs) seeded by the detail
 * page data.
 */
export async function loader({ params, url }: LoaderContext): Promise<TokenLayoutData> {
    const exchange = params.exchange!;
    const legacySymbol = decodeURIComponent(exchange).replace(/^\$/, '');
    const isNewRoute = legacySymbol === 'cex' || legacySymbol === 'dex';
    const slugs = params['*'] ? params['*'].split('/') : [];
    const slug = slugs[0]; // category of the legacy route, or coingecko_id of the new route
    const rawSearch = url.search.replace(/^\?/, '');

    const newSearch = !isNewRoute
        ? updateSearch(rawSearch, slug ? { category: slug } : {})
        : rawSearch
          ? `?${rawSearch}`
          : '';

    // legacy search param: the exchange segment already is a coingecko id
    if (!isNewRoute && url.searchParams.get('isCoinId') === 'true') {
        redirect(`/token/cex/${legacySymbol}${newSearch}`);
    }

    const query = resolveTokenDetailQueryOptions(exchange, slugs, url.searchParams);
    const pageData = await getTokenDetailPageData(
        query.token_symbol,
        query.coingecko_id,
        query.chain_id,
        query.address,
    );
    if (!pageData) notFound();

    if (!isNewRoute) {
        const { token } = pageData;
        const href = token.id
            ? `/token/cex/${token.id}${newSearch}`
            : `/token/dex/${query.chain_id || token.chainId}/${query.address || token.address}${newSearch}`;
        // ssr redirect() has no replace variant; 302 matches the intent of
        // Next's RedirectType.replace for a GET navigation.
        redirect(href, 302);
    }

    return { ...pageData, slug };
}

export default function TokenExchangeLayout({ children }: { children?: ReactNode }) {
    const { token, tokenQueryOptions, initialTrending, slug } =
        useLoaderData<TokenLayoutData>('token/$exchange/_layout.tsx');

    return (
        <TokenContextProvider token={token} tokenQueryOptions={tokenQueryOptions} initialTrending={initialTrending}>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black uppercase text-lightMain">
                        {token?.symbol || slug}
                    </span>
                </div>
                <MobileSwapButton className="ml-auto flex !gap-2 whitespace-nowrap !px-4 font-bold" token={token} />
            </div>
            <WrapTokenMarketData className="sticky" token={token} />
            <CategoryTabs token={token} className="sticky top-[54px] !z-30 md:top-[60px]" />
            <div className="flex grow flex-col p-3">{children}</div>
        </TokenContextProvider>
    );
}
