import { isSameAddress, leftShift } from '@masknet/web3-shared-base';
import { ChainId, getCoinGeckoConstants } from '@masknet/web3-shared-solana';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { compact } from 'lodash-es';

import { NetworkType, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { multipliedBy } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SolanaChainResolver } from '@/mask/index.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { getNativeTokenBalance } from '@/providers/solana/getTokenBalance.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import type { CoinGeckoAsset } from '@/providers/types/CoinGecko.js';
import type { GetProgramAccountsResponse, SplToken } from '@/providers/types/Solana.js';
import type { Token } from '@/providers/types/Transfer.js';

export const getAllSolanaTokens = memoizePromise(
    async () => {
        const result = await fetchJSON<{ data: SplToken[] }>('/api/rp/solana-tokens', { cache: 'force-cache' });
        return result.data;
    },
    () => 'solana-all-tokens',
);

async function getNativeTokenData(chainId: number, account: string): Promise<Token> {
    const nativeCurrency = SolanaChainResolver.nativeCurrency(chainId);
    const nativeBalance = await getNativeTokenBalance(account, chainId);
    const { COIN_ID } = getCoinGeckoConstants(chainId);

    const tokenPrice = COIN_ID ? await runInSafeAsync(() => CoinGecko.getTokenPrice(COIN_ID)) : undefined;
    const tokenAmount = leftShift(nativeBalance.value, nativeCurrency.decimals);

    return {
        chainId: nativeCurrency.chainId,
        balance: formatBalance(nativeBalance.value, nativeCurrency.decimals),
        usdValue: multipliedBy(tokenAmount, tokenPrice || 0).toNumber(),
        amount: tokenAmount.toNumber(),
        chain: 'solana',
        decimals: nativeCurrency.decimals,
        display_symbol: nativeCurrency.symbol,
        id: nativeCurrency.address,
        is_core: false,
        is_verified: true,
        is_wallet: false,
        logo_url: nativeCurrency.logoURL || '',
        name: nativeCurrency.name,
        optimized_symbol: nativeCurrency.symbol,
        price: `${tokenPrice ?? 0}`,
        price_24h_change: 0,
        protocol_id: 'solana',
        raw_amount: nativeBalance.value,
        raw_amount_hex_str: nativeBalance.value,
        symbol: nativeCurrency.symbol,
        time_at: Date.now(),
        networkType: NetworkType.Solana,
    };
}

async function getMarketDataForAllTokens(addressList: string[]) {
    const tasks: Array<Promise<CoinGeckoAsset[]>> = [];
    // CoinGecko API has a limit of 30 tokens per request
    const chunkSize = 28;
    for (let i = 0; i < addressList.length; i += chunkSize) {
        tasks.push(CoinGecko.getTokenByAddressList(addressList.slice(i, i + chunkSize), 'solana'));
    }

    return (await Promise.all(tasks)).flat();
}

export async function getSolanaTokenList(chainId: number, account: string): Promise<Token[]> {
    const programs = await requestRPC<GetProgramAccountsResponse>(chainId, {
        method: 'getProgramAccounts',
        params: [
            TOKEN_PROGRAM_ID.toBase58(),
            {
                encoding: 'jsonParsed',
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: account,
                        },
                    },
                ],
            },
        ],
    });
    const nativeToken = await runInSafeAsync(() => getNativeTokenData(chainId, account));

    if (!programs?.result?.length) return compact([nativeToken]);

    const addressList = programs.result.map((program) => program.account.data.parsed.info.mint);
    const marketData =
        addressList?.length && env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Disabled
            ? await runInSafeAsync(() => getMarketDataForAllTokens(addressList))
            : undefined;
    const splTokens = await runInSafeAsync(() => getAllSolanaTokens());

    return compact([
        nativeToken,
        ...programs.result.map((program) => {
            const tokenAccount = program.account.data.parsed.info;
            const marketInfo = marketData?.find((info) => isSameAddress(info.attributes.address, tokenAccount.mint));
            const attributes = marketInfo?.attributes;
            const tokenAmount = leftShift(tokenAccount.tokenAmount.amount, attributes?.decimals);
            const splToken = splTokens?.find((token) => isSameAddress(token.address, tokenAccount.mint));

            const symbol = attributes?.symbol || splToken?.symbol;
            const logoImage = splToken?.logoURI || attributes?.image_url || '';

            if (!symbol) return null;

            return {
                chainId: ChainId.Mainnet,
                balance: tokenAccount.tokenAmount.uiAmountString,
                usdValue: multipliedBy(tokenAmount, attributes?.price_usd || '0').toNumber(),
                amount: tokenAmount.toNumber(),
                chain: 'solana',
                decimals: tokenAccount.tokenAmount.decimals,
                display_symbol: symbol,
                id: tokenAccount.mint,
                is_core: false,
                is_verified: true,
                is_wallet: false,
                logo_url: logoImage !== 'missing.png' ? logoImage : '',
                name: attributes?.name || splToken?.name || '-',
                optimized_symbol: symbol,
                price: attributes?.price_usd || '0',
                price_24h_change: 0,
                protocol_id: 'solana',
                raw_amount: `${tokenAccount.tokenAmount.amount}`,
                raw_amount_hex_str: `${tokenAccount.tokenAmount.amount}`,
                symbol,
                time_at: Date.now(),
                networkType: NetworkType.Solana,
            };
        }),
    ]);
}
