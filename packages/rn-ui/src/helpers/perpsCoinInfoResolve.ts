import type { MarginTableResponse } from '@nktkas/hyperliquid';

import type { CoinInfo, PerpAssetCtxSchema, PerpsMeta } from '@/types/ui';

/** Minimal shape of `infoClient.allPerpMetas()` entries used for resolution. */
export interface PerpMetaDexEntry {
    universe: PerpsMeta[];
    marginTables?: Array<[number, MarginTableResponse]>;
}

/**
 * Stable signature for websocket asset context rows. When unchanged, consumers can keep
 * the previous object reference to avoid React re-renders.
 */
export function perpAssetCtxSignature(ctx: PerpAssetCtxSchema): string {
    return [
        ctx.prevDayPx,
        ctx.dayNtlVlm,
        ctx.markPx,
        ctx.midPx ?? '',
        ctx.funding,
        ctx.openInterest,
        ctx.premium ?? '',
        ctx.oraclePx,
        ctx.dayBaseVlm,
        JSON.stringify(ctx.impactPxs),
    ].join('|');
}

export function pickRawAssetCtxForCoin(
    allDexsAssetCtxs: Array<[dex: string, ctx: PerpAssetCtxSchema[]]> | undefined,
    dex: string,
    coinIndexInUniverse: number,
): PerpAssetCtxSchema | undefined {
    const dexCtx = allDexsAssetCtxs?.find(([d]) => d === dex);
    return dexCtx?.[1]?.[coinIndexInUniverse];
}

export interface ResolvedCoinStatic {
    meta: PerpsMeta;
    dex: string;
    coinIndexInUniverse: number;
    dexIndex: number;
    marginTable?: MarginTableResponse;
    /** Hyperliquid API index used by trading hooks */
    hlCoinIndex: number;
}

export function resolveCoinStatic(allMetas: PerpMetaDexEntry[], coinName: string): ResolvedCoinStatic | null {
    if (!allMetas?.length || !coinName) return null;

    const dexIndex = allMetas.findIndex((meta) => meta.universe.some((c) => c.name === coinName));
    if (dexIndex === -1) return null;

    const meta = allMetas[dexIndex];
    const coinIndexInUniverse = meta.universe.findIndex((c) => c.name === coinName);
    if (coinIndexInUniverse === -1) return null;

    const coinMeta = meta.universe[coinIndexInUniverse];
    const marginTable = meta.marginTables?.find((table) => table[0] === coinMeta.marginTableId)?.[1];
    const dex = coinMeta.name.includes(':') ? coinMeta.name.split(':')[0] : '';
    const hlCoinIndex = dexIndex === 0 ? coinIndexInUniverse : 100000 + dexIndex * 10000 + coinIndexInUniverse;

    return {
        meta: coinMeta,
        dex,
        coinIndexInUniverse,
        dexIndex,
        marginTable,
        hlCoinIndex,
    };
}

export function computePriceDiff(assetCtx: PerpAssetCtxSchema | undefined): {
    priceDiff: number | undefined;
    priceDiffRatio: number | undefined;
} {
    if (!assetCtx) return { priceDiff: undefined, priceDiffRatio: undefined };
    const priceDiff = parseFloat(assetCtx.markPx) - parseFloat(assetCtx.prevDayPx);
    const priceDiffRatio =
        assetCtx && priceDiff
            ? parseFloat(assetCtx.prevDayPx) > 0
                ? (priceDiff / parseFloat(assetCtx.prevDayPx)) * 100
                : undefined
            : undefined;
    return { priceDiff, priceDiffRatio };
}

/** Build CoinInfo from static resolution + (optional) live asset context. */
export function buildCoinInfo(staticPart: ResolvedCoinStatic, assetCtx: PerpAssetCtxSchema | undefined): CoinInfo {
    const { priceDiff, priceDiffRatio } = computePriceDiff(assetCtx);
    const coin = staticPart.meta;
    return {
        ...coin,
        index: staticPart.hlCoinIndex,
        marginTable: staticPart.marginTable,
        dex: staticPart.dex,
        assetCtx,
        priceDiff,
        priceDiffRatio,
    };
}

/**
 * Full fingerprint for a CoinInfo used to reuse the previous object reference when
 * display-relevant fields are unchanged.
 */
export function coinInfoStableSignature(
    coinName: string,
    hlCoinIndex: number,
    assetCtx: PerpAssetCtxSchema | undefined,
    priceDiff: number | undefined,
    priceDiffRatio: number | undefined,
): string {
    const ctxSig = assetCtx ? perpAssetCtxSignature(assetCtx) : '';
    return [coinName, String(hlCoinIndex), ctxSig, String(priceDiff ?? ''), String(priceDiffRatio ?? '')].join('::');
}
