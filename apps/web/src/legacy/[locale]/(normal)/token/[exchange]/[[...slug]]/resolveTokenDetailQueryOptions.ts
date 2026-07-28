import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { z } from 'zod';

const QueryOptionsSchema = z.object({
    address: z.string().optional(),
    isCoinId: z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : undefined)),
    chainId: z.coerce.number().int().optional(),
});

interface TokenDetailQueryOptions {
    token_symbol: string | undefined;
    coingecko_id: string | undefined;
    chain_id: number | undefined;
    address: string | undefined;
    pathname: string;
    isNewRoute: boolean;
    legacySymbol: string;
    isCoinId: boolean;
    isCexCoin: boolean;
    isDexCoin: boolean;
}

function toSearchRecord(search: URLSearchParams | Record<string, string | string[] | undefined> | null | undefined) {
    if (!search) return {};
    if (search instanceof URLSearchParams) return Object.fromEntries(search.entries());
    return search;
}

/** Derive primitive token lookup fields shared by layout and generateMetadata. */
export function resolveTokenDetailQueryOptions(
    exchange: string,
    slug: string[] | undefined,
    search: URLSearchParams | Record<string, string | string[] | undefined> | null | undefined,
): TokenDetailQueryOptions {
    const legacySymbol = decodeURIComponent(exchange).replace(/^\$/, '');
    const isCexCoin = legacySymbol === 'cex';
    const isDexCoin = legacySymbol === 'dex';
    const isNewRoute = isCexCoin || isDexCoin;
    const slugs = slug || [];
    const slug0 = slugs[0];

    const searchRecord = toSearchRecord(search);
    const options = QueryOptionsSchema.safeParse(searchRecord).data;
    const isCoinId =
        search instanceof URLSearchParams ? search.get('isCoinId') === 'true' : searchRecord.isCoinId === 'true';

    const paramChainId =
        options?.chainId ??
        (search instanceof URLSearchParams && search.get('chainId') ? Number(search.get('chainId')) : undefined);
    const isAddress = isValidAddressEthereum(legacySymbol) || isValidAddressSolana(legacySymbol);
    const paramAddress = isDexCoin ? slugs[1] : isAddress ? legacySymbol : options?.address;
    const token_symbol = isAddress || isCoinId || isNewRoute ? undefined : legacySymbol;
    const coingecko_id = isCexCoin ? slug0 : undefined;
    const chain_id = paramChainId ?? (isDexCoin && slug0 ? Number(slug0) : undefined);
    const pathname = slug?.length ? `/token/${exchange}/${slug.join('/')}` : `/token/${exchange}`;

    return {
        token_symbol,
        coingecko_id,
        chain_id,
        address: paramAddress,
        pathname,
        isNewRoute,
        legacySymbol,
        isCoinId,
        isCexCoin,
        isDexCoin,
    };
}
