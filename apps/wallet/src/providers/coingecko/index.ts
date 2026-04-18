import { isValidChainIdSolana, solana } from '@dimensiondev/web3/chains';
import {
    isSameAddress,
    isValidAddressEthereum,
    isZeroAddressEthereum,
    isZeroAddressSolana,
} from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    linea,
    mainnet,
    metis,
    optimism,
    polygon,
    scroll,
    zkSync,
} from 'viem/chains';

import { COINGECKO_ROOT_URL } from '@/constants/static.js';
import { Fetch } from '@/lib/Fetch.js';
import type { Price } from '@/providers/coingecko/types.js';

function getCoinGeckoConstantsSolana(chainId: number) {
    if (chainId !== solana.id) {
        return {
            COIN_ID: '',
            PLATFORM_ID: '',
        };
    }
    return {
        PLATFORM_ID: 'solana',
        COIN_ID: 'solana',
    };
}

function getCoinGeckoConstants(chainId: number) {
    const PLATFORM_ID: Record<string, string> = {
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
    };
    const COIN_ID: Record<string, string> = {
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
    };
    const key = (
        {
            [mainnet.id]: 'Mainnet',
            [bsc.id]: 'BSC',
            [base.id]: 'Base',
            [polygon.id]: 'Polygon',
            [arbitrum.id]: 'Arbitrum',
            [gnosis.id]: 'xDai',
            [optimism.id]: 'Optimism',
            [avalanche.id]: 'Avalanche',
            [celo.id]: 'Celo',
            [fantom.id]: 'Fantom',
            [aurora.id]: 'Aurora',
            [confluxESpace.id]: 'Conflux',
            [metis.id]: 'Metis',
            [scroll.id]: 'Scroll',
            [linea.id]: 'Linea',
            [zkSync.id]: 'ZksyncEra',
        } as const
    )[chainId];

    if (!key)
        return {
            COIN_ID: '',
            PLATFORM_ID: '',
        };
    const coinId = COIN_ID[key];
    const platformId = PLATFORM_ID[key];
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
