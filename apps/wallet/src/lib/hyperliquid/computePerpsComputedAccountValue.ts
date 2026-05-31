import { BigNumber } from 'bignumber.js';

/** Mirrors `@dimensiondev/rn-ui`'s perpsComputedAccountValue abstraction modes. */
export type PerpsAbstractionMode =
    | 'DEFAULT'
    | 'UNIFIED_ACCOUNT'
    | 'PORTFOLIO_MARGIN'
    | 'DEX_ABSTRACTION'
    | 'DISABLED'
    | undefined;

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

export interface PerpsAccountSummaryLike {
    accountValue?: string;
    withdrawable?: string;
}

export interface PerpsComputedAccountValueResult {
    accountValue: string | undefined;
    withdrawable: string | undefined;
    isLoading: boolean;
}

export interface SpotAssetCtxLike {
    coin: string;
    midPx?: string;
    markPx?: string;
}

/** Response tuple from `{ type: 'spotMetaAndAssetCtxs' }`. */
export type SpotMetaAndAssetCtxsResponse = [unknown, SpotAssetCtxLike[]];

export interface ClearinghouseStateLike {
    marginSummary?: { accountValue?: string };
    withdrawable?: string;
}

export interface SpotClearinghouseStateLike {
    balances?: PerpsSpotBalanceLike[];
}

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

function buildSpotData(
    spotState: SpotClearinghouseStateLike | undefined,
    spotMetaAndAssetCtxs: SpotMetaAndAssetCtxsResponse | undefined,
): PerpsSpotDataLike | undefined {
    if (!spotState || !spotMetaAndAssetCtxs) return undefined;

    const [, spotAssetCtxs] = spotMetaAndAssetCtxs;
    const markPriceMap = Object.fromEntries(spotAssetCtxs.map((ctx) => [ctx.coin, ctx.midPx || ctx.markPx || '0']));

    return {
        balances: spotState.balances,
        spotTotalUsd: computeSpotTotalUsd(
            {
                balances: spotState.balances,
            },
            markPriceMap,
        ),
    };
}

function buildSummary(clearinghouse: ClearinghouseStateLike | undefined): PerpsAccountSummaryLike | undefined {
    if (!clearinghouse) return undefined;
    return {
        accountValue: clearinghouse.marginSummary?.accountValue,
        withdrawable: clearinghouse.withdrawable,
    };
}

/**
 * Same rules as `perpsComputedAccountValueAtom` in rn-ui: combines Hyperliquid
 * user abstraction mode, perps clearinghouse, and spot clearinghouse + mark prices.
 */
export function computePerpsComputedAccountValue(input: {
    abstractionRaw: string | undefined;
    clearinghouse: ClearinghouseStateLike | undefined;
    spotClearinghouse: SpotClearinghouseStateLike | undefined;
    spotMetaAndAssetCtxs: SpotMetaAndAssetCtxsResponse | undefined;
}): PerpsComputedAccountValueResult {
    const mode = normalizeMode(input.abstractionRaw);
    const summary = buildSummary(input.clearinghouse);
    const spotData = buildSpotData(input.spotClearinghouse, input.spotMetaAndAssetCtxs);

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

        const usdcBalance = spotData.balances?.find((balance) => balance.token === 0);
        const usdcWithdrawable = usdcBalance ? new BigNumber(usdcBalance.total).minus(usdcBalance.hold).toFixed() : '0';

        return {
            accountValue: spotData.spotTotalUsd,
            withdrawable: usdcWithdrawable,
            isLoading: false,
        };
    }

    const perpsValue = new BigNumber(summary?.accountValue || '0');
    const spotValue = new BigNumber(spotData?.spotTotalUsd || '0');

    return {
        accountValue: spotValue.plus(perpsValue).toFixed(),
        withdrawable: summary?.withdrawable,
        isLoading: !spotData?.spotTotalUsd,
    };
}
