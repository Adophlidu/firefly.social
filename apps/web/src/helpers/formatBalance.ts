import { NODE_ENV } from '@dimensiondev/enums';
import { isLessThan, leftShift, scale10 } from '@dimensiondev/web3/numbers';
import { BigNumber } from 'bignumber.js';

import { trimZero } from '@/helpers/trimZero.js';
import { logger } from '@/libs/Logger.js';

function addThousandSeparators(num: string | number) {
    return num.toString().replaceAll(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}

interface FormatBalanceOptions {
    significant?: number;
    isPrecise?: boolean;
    isFixed?: boolean;
    fixedDecimals?: number;
    hasSeparators?: boolean;
}

export function formatBalance(rawValue: BigNumber.Value = '0', decimals = 0, options?: FormatBalanceOptions) {
    const {
        significant = decimals,
        isPrecise = false,
        isFixed = false,
        fixedDecimals = 4,
        hasSeparators = true,
    } = options ?? {};

    let balance = new BigNumber(rawValue);
    if (!balance.isInteger()) {
        const message = `Expected an integer but got ${balance.toFixed()}`;
        if (process.env.NODE_ENV === NODE_ENV.Development || process.env.NODE_ENV === NODE_ENV.Test) {
            throw new Error(message);
        } else {
            logger.error(message);
        }
    }
    balance = balance.integerValue();

    if (isFixed) {
        const value = leftShift(balance, decimals);
        const minimum = scale10(1, -fixedDecimals);
        if (value.eq(0)) return '0';
        if (isLessThan(value, minimum)) return '<' + minimum.toFixed();
        const result = trimZero(value.toFixed(fixedDecimals));
        return hasSeparators ? addThousandSeparators(result) : result;
    }

    const base = scale10(1, decimals);
    if (balance.div(base).lt(scale10(1, -8)) && balance.isGreaterThan(0) && !isPrecise) return '<0.000001';

    const negative = balance.isNegative(); // balance < 0n
    if (negative) balance = balance.absoluteValue(); // balance * -1n

    let fraction = balance.modulo(base).toString(10); // (balance % base).toString(10)

    // add leading zeros
    fraction = fraction.padStart(decimals, '0');
    // keep up to 6 decimal places
    fraction = fraction.slice(0, balance.div(base).gt(scale10(1, -6)) ? 6 : 8);

    // match significant digits
    const matchSignificantDigits = new RegExp(`^0*[1-9]\\d{0,${significant > 0 ? significant - 1 : 0}}`);
    fraction = fraction.match(matchSignificantDigits)?.[0] ?? '';

    // trim tailing zeros
    fraction = fraction.replaceAll(/0+$/g, '');
    const whole = balance.dividedToIntegerBy(base).toString(10); // (balance / base).toString(10)
    const value = `${whole}${fraction === '' ? '' : `.${fraction}`}`;

    const raw = negative ? `-${value}` : value;
    const result = raw.includes('.') ? raw.replace(/0+$/, '').replace(/\.$/, '') : raw;
    return hasSeparators ? addThousandSeparators(result) : result;
}
