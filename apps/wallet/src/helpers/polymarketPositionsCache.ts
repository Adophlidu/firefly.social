import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import type { Address } from 'viem';

import type { PolymarketPosition } from '@/providers/types/Firefly.js';

export interface PositionsPage {
    data?: PolymarketPosition[];
    nextOffset?: number;
}
export type PositionsInfiniteData = InfiniteData<PositionsPage>;
export type PositionsQueryScope = 'current' | 'closed';

export interface PositionMatcher {
    conditionId: string;
    tokenId?: string;
    outcomeLabel?: string;
}

export interface MarketData {
    title: string;
    image: string;
    marketSlug: string;
    outcomeLabel: string;
    eventSlug?: string | null;
}

export function getPositionsQueryKey(proxyAddress: Address, scope: PositionsQueryScope = 'current') {
    return ['polymarket-positions', proxyAddress.toLowerCase(), scope] as const;
}

export function getPositionsQueryKeys(proxyAddress: Address) {
    return {
        current: getPositionsQueryKey(proxyAddress, 'current'),
        closed: getPositionsQueryKey(proxyAddress, 'closed'),
    } as const;
}

/**
 * Check if a position matches the given criteria.
 * Match by tokenId first; if no tokenId, fall back to outcomeLabel (only when isUniqueCondition).
 */
export function positionMatches(
    position: PolymarketPosition,
    matcher: PositionMatcher,
    isUniqueCondition: boolean,
): boolean {
    if (position.conditionId !== matcher.conditionId) return false;

    // Primary match: by tokenId
    if (matcher.tokenId && position.tokenId === matcher.tokenId) {
        return true;
    }

    // Fallback: by outcomeLabel (only for unique conditions)
    if (isUniqueCondition && matcher.outcomeLabel) {
        return position.vote_status.toLowerCase() === matcher.outcomeLabel.toLowerCase();
    }

    // If only conditionId is provided and it's unique, match
    if (isUniqueCondition && !matcher.tokenId && !matcher.outcomeLabel) {
        return true;
    }

    return false;
}

function getPositionIdentity(position: Pick<PolymarketPosition, 'Id' | 'tokenId' | 'conditionId'>) {
    return position.Id || position.tokenId || position.conditionId;
}

/**
 * Add a new position to the cache (first buy in a market).
 */
export function optimisticAddPosition(
    queryClient: QueryClient,
    params: {
        proxyAddress: Address;
        conditionId: string;
        tokenId: string;
        shares: BigNumber.Value;
        purchasePrice: BigNumber.Value;
        curPrice: number;
        marketData: MarketData;
    },
): void {
    const shares = BigNumber(params.shares);
    const price = BigNumber(params.purchasePrice);

    // Validate inputs
    if (!shares.isFinite() || shares.lte(0)) return;
    if (!price.isFinite() || price.lte(0)) return;

    const queryKey = getPositionsQueryKey(params.proxyAddress);
    const proxy = params.proxyAddress.toLowerCase();
    const totalBuy = shares.times(price);

    const newPosition: PolymarketPosition = {
        is_closed: false,
        negRisk: false,
        isClaimable: false,
        isWin: false,
        event_slugs: params.marketData.eventSlug ? [params.marketData.eventSlug] : [],
        cur_price: params.curPrice,
        title: params.marketData.title,
        image: params.marketData.image,
        offset: 0,
        closed_time: 0,
        conditionId: params.conditionId,
        vote_status: params.marketData.outcomeLabel,
        resolvedResult: '',
        umaResolutionStatus: 'resolved',
        umaResolutionStatuses: [],
        wallet: proxy,
        tokenId: params.tokenId,
        Id: params.tokenId,
        shares: shares.toNumber(),
        total_buy: totalBuy.toNumber(),
        avg_price: price.toNumber(),
        notfill_pnl: 0,
        fill_pnl: 0,
        pnl: 0,
        pnl_rate: 0,
        marketSlug: params.marketData.marketSlug,
    };

    queryClient.setQueryData<PositionsInfiniteData>(queryKey, (old) => {
        // If no existing data, create a new InfiniteData structure
        if (!old) {
            return {
                pages: [{ data: [newPosition], nextOffset: undefined }],
                pageParams: [undefined],
            };
        }

        // Add to the beginning of the first page
        const updatedPages = [...old.pages];
        if (updatedPages.length === 0) {
            updatedPages.push({ data: [newPosition], nextOffset: undefined });
        } else {
            const firstPage = updatedPages[0];
            updatedPages[0] = {
                ...firstPage,
                data: [newPosition, ...(firstPage?.data ?? [])],
            };
        }

        return {
            ...old,
            pages: updatedPages,
        };
    });
}

/**
 * Update position shares (add shares for BUY).
 * Returns true if a matching position was found and updated.
 */
export function optimisticUpdatePositionShares(
    queryClient: QueryClient,
    params: {
        proxyAddress: Address;
        matcher: PositionMatcher;
        shareDelta: BigNumber.Value;
        purchasePrice?: BigNumber.Value;
        curPrice?: number;
    },
): boolean {
    const shareDelta = BigNumber(params.shareDelta);
    if (!shareDelta.isFinite() || shareDelta.eq(0)) return false;

    const queryKey = getPositionsQueryKey(params.proxyAddress);
    let positionFound = false;

    queryClient.setQueryData<PositionsInfiniteData>(queryKey, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => {
                if (!page?.data?.length) return page;

                // Check if this condition is unique in this page
                const conditionMatches = page.data.filter((x) => x.conditionId === params.matcher.conditionId);
                const isUniqueCondition = conditionMatches.length === 1;

                return {
                    ...page,
                    data: page.data.map((pos) => {
                        if (!positionMatches(pos, params.matcher, isUniqueCondition)) {
                            return pos;
                        }

                        positionFound = true;
                        const prevShares = BigNumber(pos.shares ?? 0);
                        const nextShares = prevShares.plus(shareDelta);

                        // Calculate new weighted average price for BUY
                        let newAvgPrice = pos.avg_price;
                        let newTotalBuy = pos.total_buy;

                        if (params.purchasePrice !== undefined && shareDelta.gt(0)) {
                            const purchasePrice = BigNumber(params.purchasePrice);
                            if (purchasePrice.isFinite() && purchasePrice.gt(0)) {
                                const prevTotalBuy = BigNumber(pos.total_buy ?? 0);
                                const addedCost = shareDelta.times(purchasePrice);
                                newTotalBuy = prevTotalBuy.plus(addedCost).toNumber();
                                // Weighted average: new_avg = total_cost / total_shares
                                newAvgPrice = nextShares.gt(0)
                                    ? BigNumber(newTotalBuy).div(nextShares).toNumber()
                                    : pos.avg_price;
                            }
                        }

                        return {
                            ...pos,
                            shares: nextShares.toNumber(),
                            total_buy: newTotalBuy,
                            avg_price: newAvgPrice,
                            cur_price: params.curPrice ?? pos.cur_price,
                        };
                    }),
                };
            }),
        };
    });

    return positionFound;
}

/**
 * Remove a position from the cache without affecting other outcomes in the same condition.
 */
export function optimisticRemovePosition(
    queryClient: QueryClient,
    params: {
        proxyAddress: Address;
        positionId?: string;
        tokenId?: string;
        scope?: PositionsQueryScope;
    },
): boolean {
    if (!params.positionId && !params.tokenId) return false;

    const queryKey = getPositionsQueryKey(params.proxyAddress, params.scope ?? 'current');
    let positionRemoved = false;

    queryClient.setQueryData<PositionsInfiniteData>(queryKey, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => {
                if (!page?.data?.length) return page;

                return {
                    ...page,
                    data: page.data.filter((position) => {
                        const matchesByTokenId = Boolean(params.tokenId) && position.tokenId === params.tokenId;
                        const matchesById =
                            Boolean(params.positionId) && getPositionIdentity(position) === params.positionId;
                        const shouldRemove = matchesByTokenId || matchesById;
                        if (shouldRemove) {
                            positionRemoved = true;
                        }
                        return !shouldRemove;
                    }),
                };
            }),
        };
    });

    return positionRemoved;
}

/**
 * Subtract shares from a position (for SELL).
 * Automatically removes the position if shares become zero or negative.
 * Returns true if a matching position was found.
 */
export function optimisticSubtractPositionShares(
    queryClient: QueryClient,
    params: {
        proxyAddress: Address;
        matcher: PositionMatcher;
        sharesToSubtract: BigNumber.Value;
    },
): boolean {
    const sharesToSubtract = BigNumber(params.sharesToSubtract);
    if (!sharesToSubtract.isFinite() || sharesToSubtract.lte(0)) return false;

    const queryKey = getPositionsQueryKey(params.proxyAddress);
    let positionFound = false;

    queryClient.setQueryData<PositionsInfiniteData>(queryKey, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => {
                if (!page?.data?.length) return page;

                // Check if this condition is unique in this page
                const conditionMatches = page.data.filter((x) => x.conditionId === params.matcher.conditionId);
                const isUniqueCondition = conditionMatches.length === 1;

                return {
                    ...page,
                    data: page.data
                        .map((pos) => {
                            if (!positionMatches(pos, params.matcher, isUniqueCondition)) {
                                return pos;
                            }

                            positionFound = true;
                            const prevShares = BigNumber(pos.shares ?? 0);
                            const nextShares = prevShares.minus(sharesToSubtract);

                            // Remove position if shares <= 0
                            if (!nextShares.isFinite() || nextShares.lte(0)) {
                                return null;
                            }

                            return {
                                ...pos,
                                shares: nextShares.toNumber(),
                            };
                        })
                        .filter((x): x is PolymarketPosition => x !== null),
                };
            }),
        };
    });

    return positionFound;
}
