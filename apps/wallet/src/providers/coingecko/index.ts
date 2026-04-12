import { getEnumAsArray } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { COINGECKO_ROOT_URL } from '@/constants/static.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { isZeroAddressEthereum, isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { Fetch } from '@/lib/Fetch.js';
import type { Price } from '@/providers/coingecko/types.js';

function getCoinGeckoConstantsSolana(chainId: number) {
    const constants = {
        PLATFORM_ID: {
            Mainnet: 'solana',
        },
        COIN_ID: {
            Mainnet: 'solana',
        },
    };
    const chainIdObj = getEnumAsArray(SolanaChainId).find(({ value }) => value === chainId);
    if (!chainIdObj)
        return {
            COIN_ID: '',
            PLATFORM_ID: '',
        };
    const coinId = (constants.COIN_ID as Record<string, string>)[chainIdObj.key];
    const platformId = (constants.PLATFORM_ID as Record<string, string>)[chainIdObj.key];
    return {
        PLATFORM_ID: platformId,
        COIN_ID: coinId,
    };
}

function getCoinGeckoConstants(chainId: number) {
    const constants = {
        PLATFORM_ID: {
            Mainnet: 'ethereum',
            BSC: 'binance-smart-chain',
            Base: 'base',
            Polygon: 'polygon-pos',
            Arbitrum: 'arbitrum-one',
            xDai: 'xdai',
            Optimism: 'optimistic-ethereum',
            Avalanche: 'avalanche',
            Celo: 'celo',
            Fantom: 'fantom',
            Aurora: 'aurora',
            Astar: 'astar',
            Boba: 'boba',
            Metis: 'metis-andromeda',
            Scroll: 'scroll',
            Linea: 'linea',
            BitTorrent: 'bittorrent',
            Harmony: 'harmony-shard-0',
        },
        COIN_ID: {
            Mainnet: 'ethereum',
            BSC: 'binancecoin',
            Base: 'ethereum',
            Polygon: 'polygon-ecosystem-token',
            Arbitrum: 'ethereum',
            xDai: 'xdai',
            Optimism: 'ethereum',
            Avalanche: 'avalanche-2',
            Celo: 'celo',
            Fantom: 'fantom',
            Aurora: 'ethereum',
            Conflux: 'conflux-token',
            Astar: 'astar',
            Pulse: 'pulsechain',
            Moonbeam: 'moonbeam',
            Klaytn: 'klay-token',
            Harmony: 'harmony',
            Moonriver: 'moonriver',
            Cronos: 'crypto-com-chain',
            BitTorrent: 'bittorrent',
            Boba: 'boba-network',
            Metis: 'metis-token',
            Scroll: 'ethereum',
            Linea: 'ethereum',
            ZksyncEra: 'ethereum',
        },
    } as const;
    const chainIdObj = getEnumAsArray(EthereumChainId).find(({ value }) => value === chainId);
    if (!chainIdObj)
        return {
            COIN_ID: '',
            PLATFORM_ID: '',
        };
    const coinId = (constants.COIN_ID as Record<string, string>)[chainIdObj.key];
    const platformId = (constants.PLATFORM_ID as Record<string, string>)[chainIdObj.key];
    return {
        PLATFORM_ID: platformId,
        COIN_ID: coinId,
    };
}

export class CoinGecko extends Fetch {
    getFungibleTokenPrice(chainId: number, address: string) {
        const isSolana = isValidChainIdSolana(chainId);
        const { PLATFORM_ID = '', COIN_ID = '' } = isSolana
            ? getCoinGeckoConstantsSolana(chainId)
            : getCoinGeckoConstants(chainId);

        const isNative = isSolana
            ? isZeroAddressSolana(address)
            : isZeroAddressEthereum(address) || !isValidAddressEthereum(address);

        return isNative ? this.getTokenPrice(COIN_ID) : this.getTokenPriceByAddress(PLATFORM_ID, address);
    }

    async getTokenPrice(coinId: string): Promise<number | undefined> {
        const url = urlcat('/simple/price', { ids: coinId, vs_currencies: 'usd' });
        const result = await this.get<Record<string, Record<string, number>>>(url);
        const price = result.data;
        return price?.[coinId]?.usd;
    }

    async getTokenPrices(platform_id: string, contractAddresses: string[]) {
        const url = urlcat('/simple/token_price/:platform_id', {
            platform_id,
            contract_addresses: contractAddresses.join(','),
            vs_currencies: 'usd',
        });

        return this.get<Record<string, Price>>(url);
    }

    async getTokenPriceByAddress(platform_id: string, address: string) {
        const price = await this.getTokenPrices(platform_id, [address]);
        const currencies = Object.entries(price).find(([key, value]) => {
            return isSameAddress(key, address) ? value : undefined;
        })?.[1];
        return currencies?.usd ? Number(currencies.usd) : undefined;
    }
}

export const coinGeckoEndpoint = new CoinGecko({ baseURL: COINGECKO_ROOT_URL });
