import BigNumber from 'bignumber.js';

export const MIN_ISOLATED_MARGIN_ADJUST_USD = new BigNumber('0.01');

export type AdjustMarginMode = 'add' | 'remove';
export type AdjustMarginInputError =
    | 'empty'
    | 'invalid'
    | 'too-precise'
    | 'below-minimum'
    | 'exceeds-available'
    | 'remove-disabled';

export function getMaxRemovableMargin({
    currentMargin,
    positionValue,
    leverage,
    canRemove,
}: {
    currentMargin: string;
    positionValue: string;
    leverage: number;
    canRemove: boolean;
}) {
    if (!canRemove) return new BigNumber(0);
    const margin = new BigNumber(currentMargin || '0');
    const notional = new BigNumber(positionValue || '0').abs();
    if (!margin.isFinite() || !notional.isFinite() || !Number.isFinite(leverage) || leverage <= 0) {
        return new BigNumber(0);
    }
    // Hyperliquid requires the remaining isolated margin to satisfy both the
    // selected initial leverage and the 10% transfer-margin floor.
    const requiredMargin = BigNumber.maximum(notional.dividedBy(leverage), notional.multipliedBy(0.1));
    return BigNumber.maximum(margin.minus(requiredMargin), 0);
}

export function getAdjustMarginInputState({
    amount,
    mode,
    withdrawable,
    currentMargin,
    positionValue,
    leverage,
    canRemove,
}: {
    amount: string;
    mode: AdjustMarginMode;
    withdrawable?: string;
    currentMargin: string;
    positionValue: string;
    leverage: number;
    canRemove: boolean;
}) {
    const amountValue = new BigNumber(amount || '0');
    const currentMarginValue = new BigNumber(currentMargin || '0');
    const addAvailable = new BigNumber(withdrawable ?? '');
    const removeAvailable = getMaxRemovableMargin({ currentMargin, positionValue, leverage, canRemove });
    const available = mode === 'add' ? addAvailable : removeAvailable;
    let error: AdjustMarginInputError | undefined;

    if (mode === 'remove' && !canRemove) error = 'remove-disabled';
    else if (!amount) error = 'empty';
    else if (!amountValue.isFinite() || amountValue.lte(0)) error = 'invalid';
    else if (amountValue.lt(MIN_ISOLATED_MARGIN_ADJUST_USD)) error = 'below-minimum';
    else if ((amountValue.decimalPlaces() ?? 0) > 2) error = 'too-precise';
    else if (!available.isFinite() || amountValue.gt(available)) error = 'exceeds-available';

    const isValid = error === undefined;
    const submitAmount = isValid ? amountValue.toFixed(2, BigNumber.ROUND_DOWN) : undefined;
    const signedAmount = mode === 'remove' ? amountValue.negated() : amountValue;
    const newTotal =
        isValid && currentMarginValue.isFinite() ? currentMarginValue.plus(signedAmount).toFixed() : undefined;

    return {
        available: available.isFinite() && available.gt(0) ? available : new BigNumber(0),
        error,
        isValid,
        newTotal,
        submitAmount,
    };
}
