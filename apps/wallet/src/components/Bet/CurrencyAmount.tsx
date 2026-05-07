import { memo } from 'react';

import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { cn } from '@/lib/utils.js';

export function parseValue(value: string) {
    if (value.startsWith('<$')) {
        return {
            prefix: '<',
            currency: '$',
            integer: '0',
            decimal: '01',
        };
    }

    const match = value.match(/^\$([\d,]+)(?:\.(\d+))?$/);

    if (!match) {
        return {
            prefix: '',
            currency: '',
            integer: value,
            decimal: '',
        };
    }

    return {
        prefix: '',
        currency: '$',
        integer: match[1],
        decimal: match[2] ?? '',
    };
}

interface Props {
    amount: BigNumber.Value;
    formatted?: string;
    className?: string;
}

export const CurrencyAmount = memo(function CurrencyAmount({ amount, formatted, className }: Props) {
    const { prefix, currency, integer, decimal } = parseValue(formatted ?? formatPortfolioUSDCe(amount) ?? '');

    return (
        <div className={cn('flex items-end', className)}>
            {prefix ? <span className="text-third text-5xl font-normal">{prefix}</span> : null}
            {currency ? <span className="text-third text-5xl font-normal">{currency}</span> : null}
            <span className="text-main ml-1 text-5xl font-semibold leading-none">{integer}</span>
            {decimal ? <span className="text-main mb-0.5 ml-0.5 self-end text-xl">.{decimal}</span> : null}
        </div>
    );
});
