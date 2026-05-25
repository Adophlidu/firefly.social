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
            {prefix ? <span className="text-5xl font-normal text-third">{prefix}</span> : null}
            {currency ? <span className="text-5xl font-normal text-third">{currency}</span> : null}
            <span className="ml-1 text-5xl font-semibold leading-none text-main">{integer}</span>
            {decimal ? <span className="mb-0.5 ml-0.5 self-end text-xl text-main">.{decimal}</span> : null}
        </div>
    );
});
