import { BigNumber } from 'bignumber.js';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';

import { infoClient } from '@/providers/client';
import { walletAddressAtom } from '@/store/wallet';

export type PerpsAbstractionMode =
    | 'DEFAULT'
    | 'UNIFIED_ACCOUNT'
    | 'PORTFOLIO_MARGIN'
    | 'DEX_ABSTRACTION'
    | 'DISABLED'
    | undefined;

export interface PerpsAccountSummaryLike {
    accountValue?: string;
    withdrawable?: string;
}

export interface PerpsSpotBalanceLike {
    coin: string;
    token: number;
    total: string;
    hold: string;
}

export interface PerpsSpotDataLike {
    spotTotalUsd?: string;
    balances?: PerpsSpotBalanceLike[];
}

export interface PerpsComputedAccountValueResult {
    accountValue: string | undefined;
    withdrawable: string | undefined;
    isLoading: boolean;
}

export const perpsComputedAccountValueWalletAddressAtom = atom((get) => {
    return get(walletAddressAtom) || undefined;
});

function normalizeMode(mode?: string): PerpsAbstractionMode {
    if (!mode) return undefined;

    switch (mode) {
        case 'default':
            return 'DEFAULT';
        case 'unifiedAccount':
            return 'UNIFIED_ACCOUNT';
        case 'portfolioMargin':
            return 'PORTFOLIO_MARGIN';
        case 'dexAbstraction':
            return 'DEX_ABSTRACTION';
        case 'disabled':
            return 'DISABLED';
        default:
            return undefined;
    }
}

function computeSpotTotalUsd(spotData: PerpsSpotDataLike | undefined, markPriceMap: Record<string, string>) {
    if (!spotData?.balances?.length) return undefined;
    const total = spotData.balances.reduce((acc, balance) => {
        const price = markPriceMap[balance.coin] || (balance.coin === 'USDC' ? '1' : '0');
        return acc.plus(new BigNumber(balance.total).multipliedBy(price));
    }, new BigNumber(0));
    return total.toFixed();
}

export const perpsUserAbstractionQueryAtom = atomWithQuery((get: any) => {
    const walletAddress = get(perpsComputedAccountValueWalletAddressAtom);

    return {
        queryKey: ['perpsUserAbstraction', walletAddress],
        enabled: Boolean(walletAddress),
        queryFn: async () =>
            infoClient.userAbstraction({
                user: walletAddress as `0x${string}`,
            }),
    };
});

export const perpsClearinghouseStateQueryAtom = atomWithQuery((get: any) => {
    const walletAddress = get(perpsComputedAccountValueWalletAddressAtom);

    return {
        queryKey: ['perpsClearinghouseState', walletAddress],
        enabled: Boolean(walletAddress),
        queryFn: async () =>
            infoClient.clearinghouseState({
                user: walletAddress as `0x${string}`,
            }),
    };
});

export const perpsSpotClearinghouseStateQueryAtom = atomWithQuery((get: any) => {
    const walletAddress = get(perpsComputedAccountValueWalletAddressAtom);

    return {
        queryKey: ['perpsSpotClearinghouseState', walletAddress],
        enabled: Boolean(walletAddress),
        queryFn: async () =>
            infoClient.spotClearinghouseState({
                user: walletAddress as `0x${string}`,
            }),
    };
});

export const perpsSpotMetaAndAssetCtxsQueryAtom = atomWithQuery(() => {
    return {
        queryKey: ['perpsSpotMetaAndAssetCtxs'],
        queryFn: async () => infoClient.spotMetaAndAssetCtxs(),
    };
});

export const perpsAbstractionModeAtom = atom<PerpsAbstractionMode>((get) => {
    const { data } = get(perpsUserAbstractionQueryAtom) as any;
    return normalizeMode(data);
});

export const perpsAccountSummaryAtom = atom<PerpsAccountSummaryLike | undefined>((get) => {
    const { data } = get(perpsClearinghouseStateQueryAtom) as any;
    if (!data) return undefined;
    return {
        accountValue: data.marginSummary?.accountValue,
        withdrawable: data.withdrawable,
    };
});

export const perpsSpotDataAtom = atom<PerpsSpotDataLike | undefined>((get) => {
    const { data: spotState } = get(perpsSpotClearinghouseStateQueryAtom) as any;
    const { data: spotMetaAndAssetCtxs } = get(perpsSpotMetaAndAssetCtxsQueryAtom) as any;
    if (!spotState || !spotMetaAndAssetCtxs) return undefined;

    const [, spotAssetCtxs] = spotMetaAndAssetCtxs;
    const markPriceMap = Object.fromEntries(
        spotAssetCtxs.map((ctx: any) => [ctx.coin, ctx.midPx || ctx.markPx || '0']),
    );

    return {
        balances: spotState.balances,
        spotTotalUsd: computeSpotTotalUsd(
            {
                balances: spotState.balances,
            },
            markPriceMap,
        ),
    };
});

export const perpsComputedAccountValueAtom = atom<PerpsComputedAccountValueResult>((get) => {
    const mode = get(perpsAbstractionModeAtom);
    const summary = get(perpsAccountSummaryAtom);
    const spotData = get(perpsSpotDataAtom);

    // Mode unknown or DEFAULT: fallback to clearinghouse values and keep loading.
    if (!mode || mode === 'DEFAULT') {
        return {
            accountValue: summary?.accountValue,
            withdrawable: summary?.withdrawable,
            isLoading: true,
        };
    }

    const isUnified = mode === 'UNIFIED_ACCOUNT' || mode === 'PORTFOLIO_MARGIN';

    if (isUnified) {
        if (!spotData?.spotTotalUsd) {
            return {
                accountValue: undefined,
                withdrawable: undefined,
                isLoading: true,
            };
        }

        // Withdrawable uses available USDC: total - hold.
        const usdcBalance = spotData.balances?.find((balance) => balance.token === 0);
        const usdcWithdrawable = usdcBalance ? new BigNumber(usdcBalance.total).minus(usdcBalance.hold).toFixed() : '0';

        return {
            accountValue: spotData.spotTotalUsd,
            withdrawable: usdcWithdrawable,
            isLoading: false,
        };
    }

    // DISABLED / DEX_ABSTRACTION: account value = spot + perps clearinghouse.
    const perpsValue = new BigNumber(summary?.accountValue || '0');
    const spotValue = new BigNumber(spotData?.spotTotalUsd || '0');

    return {
        accountValue: spotValue.plus(perpsValue).toFixed(),
        withdrawable: summary?.withdrawable,
        isLoading: !spotData?.spotTotalUsd,
    };
});

export const perpsComputedAccountValueQueryStateAtom = atom((get) => {
    const walletAddress = get(perpsComputedAccountValueWalletAddressAtom);
    const abstractionQuery = get(perpsUserAbstractionQueryAtom) as any;
    const clearinghouseQuery = get(perpsClearinghouseStateQueryAtom) as any;
    const spotStateQuery = get(perpsSpotClearinghouseStateQueryAtom) as any;
    const spotMetaQuery = get(perpsSpotMetaAndAssetCtxsQueryAtom) as any;
    const computedValue = get(perpsComputedAccountValueAtom);

    const isLoading =
        Boolean(walletAddress) &&
        (abstractionQuery.isPending ||
            clearinghouseQuery.isPending ||
            spotStateQuery.isPending ||
            spotMetaQuery.isPending ||
            computedValue.isLoading);

    const error = abstractionQuery.error || clearinghouseQuery.error || spotStateQuery.error || spotMetaQuery.error;

    const refetch = async () => {
        if (!walletAddress) return;
        await Promise.all([
            abstractionQuery.refetch(),
            clearinghouseQuery.refetch(),
            spotStateQuery.refetch(),
            spotMetaQuery.refetch(),
        ]);
    };

    return {
        ...computedValue,
        isLoading,
        error,
        refetch,
    };
});
