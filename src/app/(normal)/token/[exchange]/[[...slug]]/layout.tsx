import { headers } from 'next/headers.js';
import { notFound, redirect, RedirectType } from 'next/navigation.js';
import { type PropsWithChildren } from 'react';
import { z } from 'zod';

import { CategoryTabs } from '@/app/(normal)/token/[exchange]/[[...slug]]/CategoryTabs.js';
import { MobileSwapButton } from '@/app/(normal)/token/[exchange]/[[...slug]]/MobileSwapButton.js';
import { type TokenPageSearch } from '@/app/(normal)/token/[exchange]/[[...slug]]/types.js';
import { WrapTokenMarketData } from '@/app/(normal)/token/[exchange]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { queryClient } from '@/configs/queryClient.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { createTokenMetadata } from '@/providers/firefly/metadata/createTokenMetadata.js';
import { searchToken } from '@/providers/firefly/worker/searchToken.js';
import { type GetTokenOptions } from '@/providers/types/Firefly.js';
import { type LayoutProps } from '@/types/utility.js';

const QueryOptionsSchema = z.object({
    address: z.string().optional(),
    isCoinId: z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : undefined)),
    chainId: z.coerce.number().int().optional(),
});

interface Props
    extends LayoutProps<
        {
            exchange: string;
            slug: [coingecko_id: string] | [chain_id: string, address: string] | undefined;
        },
        TokenPageSearch
    > {}

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
    const searchParams = await props.searchParams;
    const options = QueryOptionsSchema.safeParse(searchParams).data;

    const isCexCoin = params.exchange === 'cex';
    const isDexCoin = params.exchange === 'dex';

    const keyword = isCexCoin ? params.slug?.[0] : isDexCoin ? params.slug?.[1] : params.exchange;
    return createTokenMetadata(
        keyword ?? '-',
        params.slug ? `/token/${params.exchange}/${params.slug.join('/')}` : `/token/${params.exchange}`,
        { ...options, isCoinId: isCexCoin ? true : options?.isCoinId },
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
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;
    const legacySymbol = decodeURIComponent(params.exchange).replace(/^\$/, '');
    const rawSearch = (await headers()).get('X-SEARCH-PARAMS') || '';
    const search = rawSearch ? new URLSearchParams(rawSearch) : null;

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

    const paramChainId = search?.get('chainId') ? Number(search.get('chainId')) : undefined;
    const isAddress = isValidAddressEthereum(legacySymbol) || isValidAddressSolana(legacySymbol);
    const paramAddress = isDexCoin ? slugs[1] : isAddress ? legacySymbol : search?.get('address') || undefined;
    const token = await runInSafeAsync(async () => {
        const coinId = isCexCoin ? slug : undefined;
        const options: GetTokenOptions = {
            token_symbol: isAddress || isCoinId || isNewRoute ? undefined : legacySymbol,
            coingecko_id: coinId,
            chain_id: paramChainId,
            address: paramAddress,
        };
        const token = await searchToken(options);
        queryClient.setQueryData(['token', options], token);
        return token;
    });

    if (!token) notFound();

    if (!isNewRoute) {
        const url = token.id
            ? `/token/cex/${token.id}${newSearch}`
            : `/token/dex/${paramChainId || token.chainId}/${paramAddress || token.address}${newSearch}`;
        redirect(url, RedirectType.replace);
    }

    return (
        <TokenContextProvider>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black uppercase text-lightMain">
                        {token?.symbol || (isNewRoute ? slug : legacySymbol)}
                    </span>
                </div>
                <MobileSwapButton className="ml-auto flex whitespace-nowrap" token={token} />
            </div>
            <WrapTokenMarketData className="sticky" token={token} />
            <CategoryTabs token={token} className="sticky top-[54px] !z-30 md:top-[60px]" />
            <div className="flex grow flex-col p-3">{children}</div>
        </TokenContextProvider>
    );
}
