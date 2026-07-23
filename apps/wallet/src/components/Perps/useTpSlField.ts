import {
    type ComputeMethod,
    convertTpSlGainMethod,
    type TpSlAnchor,
    tpSlGainToPrice,
    tpSlPriceToGain,
} from '@dimensiondev/perps-core';
import { useCallback, useState } from 'react';

/** Live conversion context for one take-profit / stop-loss field. */
export interface TpSlFieldContext {
    isTp: boolean;
    isLong: boolean;
    /** Live entry reference (order price on the trade form, entry price on a position). */
    entryPrice: string;
    leverage: number;
    size: string;
    szDecimals: number;
}

interface TpSlFieldState {
    price: string;
    gain: string;
    anchor: TpSlAnchor;
    method: ComputeMethod;
}

/**
 * Derive the values to show. Whichever side is anchored is shown verbatim; the other
 * is computed against the live entry so it stays correct as the entry price moves.
 */
export function resolveTpSlDisplays(
    { price, gain, anchor, method }: TpSlFieldState,
    { isTp, isLong, entryPrice, leverage, size, szDecimals }: TpSlFieldContext,
): { priceDisplay: string; gainDisplay: string } {
    return {
        priceDisplay:
            anchor === 'price'
                ? price
                : tpSlGainToPrice({ gain, method, entryPrice, isLong, isTp, leverage, size, szDecimals }),
        gainDisplay:
            anchor === 'gain' ? gain : tpSlPriceToGain({ price, method, entryPrice, isLong, isTp, leverage, size }),
    };
}

/**
 * Flip the gain unit (USD ⇄ ratio). Only a gain the user typed carries a unit to
 * convert; a price-anchored gain is derived and re-renders against the new method on
 * its own, so its stored value is left untouched.
 */
export function resolveTpSlMethodToggle(
    { gain, anchor, method }: Pick<TpSlFieldState, 'gain' | 'anchor' | 'method'>,
    { isTp, entryPrice, leverage, size, szDecimals }: TpSlFieldContext,
): { method: ComputeMethod; gain: string } {
    const nextMethod: ComputeMethod = method === 'usd' ? 'ratio' : 'usd';
    if (anchor !== 'gain') return { method: nextMethod, gain };
    return {
        method: nextMethod,
        gain: convertTpSlGainMethod({
            gain,
            fromMethod: method,
            toMethod: nextMethod,
            entryPrice,
            isTp,
            leverage,
            size,
            szDecimals,
        }),
    };
}

export interface TpSlField {
    /** Raw user-entered price (authoritative only while `anchor === 'price'`). */
    price: string;
    /** Raw user-entered gain (authoritative only while `anchor === 'gain'`). */
    gain: string;
    anchor: TpSlAnchor;
    method: ComputeMethod;
    priceDisplay: string;
    gainDisplay: string;
    changePrice: (value: string) => void;
    changeGain: (value: string) => void;
    toggleMethod: () => void;
    reset: () => void;
}

/**
 * Manages one take-profit or stop-loss field as a price ⇄ gain pair. Whichever side the
 * user last edited is the anchor; the other is derived on every render. Input
 * normalization and validation stay with the caller — this hook owns only the anchor
 * state machine and its derived displays.
 */
export function useTpSlField(context: TpSlFieldContext & { initialMethod?: ComputeMethod }): TpSlField {
    const { initialMethod = 'usd', ...conversion } = context;
    const [price, setPrice] = useState('');
    const [gain, setGain] = useState('');
    const [anchor, setAnchor] = useState<TpSlAnchor>('price');
    const [method, setMethod] = useState<ComputeMethod>(initialMethod);

    const { priceDisplay, gainDisplay } = resolveTpSlDisplays({ price, gain, anchor, method }, conversion);

    const changePrice = useCallback((value: string) => {
        setPrice(value);
        setAnchor('price');
    }, []);

    const changeGain = useCallback((value: string) => {
        setGain(value);
        setAnchor('gain');
    }, []);

    const toggleMethod = useCallback(() => {
        const next = resolveTpSlMethodToggle({ gain, anchor, method }, conversion);
        setGain(next.gain);
        setMethod(next.method);
    }, [gain, anchor, method, conversion]);

    const reset = useCallback(() => {
        setPrice('');
        setGain('');
        setAnchor('price');
    }, []);

    return { price, gain, anchor, method, priceDisplay, gainDisplay, changePrice, changeGain, toggleMethod, reset };
}
