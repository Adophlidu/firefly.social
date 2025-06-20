import { headers } from 'next/headers.js';
import { notFound } from 'next/navigation.js';
import type { PropsWithChildren } from 'react';
import { z } from 'zod';

import { CategoryTabs, type TokenPageSearch } from '@/app/(normal)/token/[symbol]/[[...slug]]/CategoryTabs.js';
import { WrapTokenMarketData } from '@/app/(normal)/token/[symbol]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataToken } from '@/helpers/createMetadataToken.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { searchToken } from '@/services/searchToken.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<
        {
            symbol: string;
            slug: [category: string] | undefined;
        },
        TokenPageSearch
    > {}

const createPageMetadata = memoizeWithRedis(createMetadataToken, {
    key: KeyType.CreateMetadataToken,
});

export async function generateMetadata(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const options = z
        .object({
            address: z.string().optional(),
            isCoinId: z
                .string()
                .optional()
                .transform((val) => (val === 'true' ? true : undefined)),
            chainId: z.coerce.number().int().optional(),
        })
        .safeParse(searchParams).data;
    return createPageMetadata(params.symbol, options);
}

export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;
    const paramSymbol = decodeURIComponent(params.symbol).replace(/^\$/, '');
    const rawSearch = (await headers()).get('X-SEARCH-PARAMS');
    const search = rawSearch ? new URLSearchParams(rawSearch) : null;

    const token = await runInSafeAsync(async () => {
        const isAddress = isValidAddressEthereum(paramSymbol) || isValidAddressSolana(paramSymbol);
        const isCoinId = search?.get('isCoinId') === 'true';
        return searchToken({
            token_symbol: isAddress || isCoinId ? undefined : paramSymbol,
            coingecko_id: isCoinId ? paramSymbol : undefined,
            address: isAddress ? paramSymbol : search?.get('address') || undefined,
            chain_id: search?.get('chainId') ? Number(search.get('chainId')) : undefined,
        });
    });

    if (!token) {
        notFound();
    }
    const slug = params.slug?.[0];

    return (
        <TokenContextProvider>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black uppercase text-lightMain">
                        {token?.symbol || paramSymbol}
                    </span>
                </div>
                <SwapButton className="ml-auto sm:inline-flex md:hidden" />
            </div>
            <WrapTokenMarketData className="sticky" token={token} address={search?.get('address') || undefined} />
            <CategoryTabs slug={slug} token={token} className="sticky top-[54px] !z-30 md:top-[60px]" />
            <div className="flex flex-grow flex-col p-3">{children}</div>
        </TokenContextProvider>
    );
}
