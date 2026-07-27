import { type LoaderContext, notFound, redirect } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { resolveTokenDetailQueryOptions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/resolveTokenDetailQueryOptions.js';
import { getTokenDetailPageData } from '@/providers/firefly/metadata/getTokenDetailPageData.js';

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

/**
 * Redirect half of the Next token layout
 * (src/app/[locale]/(normal)/token/[exchange]/[[...slug]]/layout.tsx):
 * legacy URLs (`/token/[symbol or address]/[category]`) are redirected to the
 * canonical routes (`/token/cex/[coingecko_id]`, `/token/dex/[chain_id]/[address]`).
 * Canonical routes pass through untouched and render via `token/$exchange/$.tsx`.
 */
export async function loader({ params, url }: LoaderContext) {
    const exchange = params.exchange!;
    const legacySymbol = decodeURIComponent(exchange).replace(/^\$/, '');
    const isNewRoute = legacySymbol === 'cex' || legacySymbol === 'dex';
    if (isNewRoute) return null;

    const slugs = params['*'] ? params['*'].split('/') : [];
    const slug = slugs[0]; // category of the legacy route
    const rawSearch = url.search.replace(/^\?/, '');
    const newSearch = updateSearch(rawSearch, slug ? { category: slug } : {});

    // legacy search param: the exchange segment already is a coingecko id
    if (url.searchParams.get('isCoinId') === 'true') {
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

    const { token } = pageData;
    const href = token.id
        ? `/token/cex/${token.id}${newSearch}`
        : `/token/dex/${query.chain_id || token.chainId}/${query.address || token.address}${newSearch}`;
    // ssr redirect() has no replace variant; 302 matches the intent of Next's
    // RedirectType.replace for a GET navigation.
    redirect(href, 302);
}

export default function TokenExchangeLayout({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}
