import { describe, expect, it } from 'vitest';

import {
    coinInfoStableSignature,
    computePriceDiff,
    perpAssetCtxSignature,
    pickRawAssetCtxForCoin,
    resolveCoinStatic,
} from '../../../../packages/rn-ui/src/helpers/perpsCoinInfoResolve.js';
import type { PerpAssetCtxSchema } from '../../../../packages/rn-ui/src/types/ui.js';

const sampleCtx = (mark: string): PerpAssetCtxSchema => ({
    prevDayPx: '100',
    dayNtlVlm: '1',
    markPx: mark,
    midPx: mark,
    funding: '0',
    openInterest: '1',
    premium: null,
    oraclePx: mark,
    impactPxs: null,
    dayBaseVlm: '1',
});

describe('perpAssetCtxSignature', () => {
    it('matches for identical field values', () => {
        const a = sampleCtx('50000');
        const b = { ...sampleCtx('50000') };
        expect(perpAssetCtxSignature(a)).toBe(perpAssetCtxSignature(b));
    });

    it('changes when markPx changes', () => {
        const a = sampleCtx('1');
        const b = sampleCtx('2');
        expect(perpAssetCtxSignature(a)).not.toBe(perpAssetCtxSignature(b));
    });
});

describe('coinInfoStableSignature', () => {
    it('includes coin and index in the fingerprint', () => {
        const ctx = sampleCtx('3');
        const s1 = coinInfoStableSignature('BTC', 0, ctx, 1, 2);
        const s2 = coinInfoStableSignature('ETH', 0, ctx, 1, 2);
        expect(s1).not.toBe(s2);
    });
});

describe('computePriceDiff', () => {
    it('returns undefined ratios when assetCtx missing', () => {
        expect(computePriceDiff(undefined)).toEqual({ priceDiff: undefined, priceDiffRatio: undefined });
    });
});

describe('pickRawAssetCtxForCoin', () => {
    it('returns ctx at coin index for dex', () => {
        const ctx = sampleCtx('9');
        const all: Array<[string, PerpAssetCtxSchema[]]> = [['', [ctx]]];
        expect(pickRawAssetCtxForCoin(all, '', 0)).toBe(ctx);
        expect(pickRawAssetCtxForCoin(all, '', 1)).toBeUndefined();
    });
});

describe('resolveCoinStatic', () => {
    it('resolves HL index for primary dex', () => {
        const metas = [
            {
                universe: [{ name: 'BTC', szDecimals: 4, maxLeverage: 40, marginTableId: 1 }],
                marginTables: [[1, {} as never]],
            },
        ];
        const r = resolveCoinStatic(metas, 'BTC');
        expect(r?.hlCoinIndex).toBe(0);
        expect(r?.dex).toBe('');
    });
});
