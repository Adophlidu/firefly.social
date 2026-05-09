import { BigNumber } from 'bignumber.js';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';

import { infoClient } from '@/providers/client';
import { walletAddressAtom } from '@/store/wallet';
import { allDexsClearinghouseStateAtom, spotStateAtom } from '@/store/websocket';

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

interface PerpsClearinghouseAggregateLike {
    marginSummary?: {
        accountValue?: string;
    };
    withdrawable?: string;
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
    const balances = spotData?.balances;
    // Loaded spot state with no balances is a valid empty portfolio (not "still loading").
    if (!balances?.length) {
        return '0';
    }
    const total = balances.reduce((acc, balance) => {
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

export const perpsAggregatedClearinghouseStateAtom = atom<PerpsClearinghouseAggregateLike | undefined>((get) => {
    const allDexsState = get(allDexsClearinghouseStateAtom);
    if (!allDexsState.length) return undefined;

    const aggregated = allDexsState.reduce(
        (acc, [, state]) => {
            if (!state) return acc;
            acc.accountValue = acc.accountValue.plus(state.marginSummary?.accountValue || '0');
            acc.withdrawable = acc.withdrawable.plus(state.withdrawable || '0');
            return acc;
        },
        {
            accountValue: new BigNumber(0),
            withdrawable: new BigNumber(0),
        },
    );

    return {
        marginSummary: {
            accountValue: aggregated.accountValue.toFixed(),
        },
        withdrawable: aggregated.withdrawable.toFixed(),
    };
});

export const perpsAccountSummaryAtom = atom<PerpsAccountSummaryLike | undefined>((get) => {
    const websocketData = get(perpsAggregatedClearinghouseStateAtom);
    const { data: queryData } = get(perpsClearinghouseStateQueryAtom) as any;
    const data = websocketData ?? queryData;
    if (!data) return undefined;
    return {
        accountValue: data.marginSummary?.accountValue,
        withdrawable: data.withdrawable,
    };
});

export const perpsSpotDataAtom = atom<PerpsSpotDataLike | undefined>((get) => {
    const websocketSpotState = get(spotStateAtom);
    const { data: spotStateQueryData } = get(perpsSpotClearinghouseStateQueryAtom) as any;
    const { data: spotMetaAndAssetCtxs } = get(perpsSpotMetaAndAssetCtxsQueryAtom) as any;
    const spotState = websocketSpotState ?? spotStateQueryData;
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

    // Mode unknown or DEFAULT: show perps clearinghouse only. Loading is driven by
    // perpsComputedAccountValueQueryStateAtom (queries), not stuck true here — otherwise
    // sheets that gate UI on isLoading never reveal actions (e.g. deposit).
    if (!mode || mode === 'DEFAULT') {
        return {
            accountValue: summary?.accountValue,
            withdrawable: summary?.withdrawable,
            isLoading: false,
        };
    }

    const isUnified = mode === 'UNIFIED_ACCOUNT' || mode === 'PORTFOLIO_MARGIN';

    if (isUnified) {
        if (!spotData) {
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
        // Wait until spot payload exists; empty balances yield spotTotalUsd "0" from computeSpotTotalUsd.
        isLoading: !spotData,
    };
});

export const perpsComputedAccountValueQueryStateAtom = atom((get) => {
    const walletAddress = get(perpsComputedAccountValueWalletAddressAtom);
    const abstractionQuery = get(perpsUserAbstractionQueryAtom) as any;
    const clearinghouseQuery = get(perpsClearinghouseStateQueryAtom) as any;
    const aggregatedClearinghouse = get(perpsAggregatedClearinghouseStateAtom);
    const spotStateQuery = get(perpsSpotClearinghouseStateQueryAtom) as any;
    const websocketSpotState = get(spotStateAtom);
    const spotMetaQuery = get(perpsSpotMetaAndAssetCtxsQueryAtom) as any;
    const computedValue = get(perpsComputedAccountValueAtom);

    const shouldWaitClearinghouseQuery = !aggregatedClearinghouse && clearinghouseQuery.isPending;
    const shouldWaitSpotStateQuery = !websocketSpotState && spotStateQuery.isPending;

    const isLoading =
        Boolean(walletAddress) &&
        (abstractionQuery.isPending ||
            shouldWaitClearinghouseQuery ||
            shouldWaitSpotStateQuery ||
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
