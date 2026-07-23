'use client';

import type { PerpsIntent } from '@dimensiondev/iframe-bridge';
import { type PerpsAddress, usePerpsComputedAccountValue } from '@dimensiondev/perps-react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { formatPerpsAccountBalance } from '@/components/Perps/formatPerpsAccountBalance.js';

interface Props {
    address?: PerpsAddress;
    onIntent: (intent: PerpsIntent) => void;
}

function AuthenticatedSummary({ address, onIntent }: Required<Props>) {
    const { accountValue, withdrawable, isLoading } = usePerpsComputedAccountValue(address);
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label={t`Portfolio account value`}
                className="rounded-lg px-2 py-1 text-left outline-none hover:bg-[#f5f5f9] focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'account' })}
            >
                <span className="block text-xs leading-[14px] text-[#b1b1b1]">
                    <Trans>Portfolio</Trans>
                </span>
                <span className="block text-sm font-semibold leading-5 text-[#4c4aa9]">
                    {isLoading ? '$--' : formatPerpsAccountBalance(accountValue)}
                </span>
            </button>
            <button
                type="button"
                aria-label={t`Withdrawable cash`}
                className="rounded-lg px-2 py-1 text-left outline-none hover:bg-[#f5f5f9] focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'account' })}
            >
                <span className="block text-xs leading-[14px] text-[#b1b1b1]">
                    <Trans>Cash</Trans>
                </span>
                <span className="block text-sm font-semibold leading-5 text-[#4c4aa9]">
                    {isLoading ? '$--' : formatPerpsAccountBalance(withdrawable)}
                </span>
            </button>
            <button
                type="button"
                className="h-8 rounded-lg bg-lightTextMain px-5 text-[15px] font-bold leading-5 text-white outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'deposit' })}
            >
                <Trans>Deposit</Trans>
            </button>
        </div>
    );
}

export const PerpsAccountHeader = memo(function PerpsAccountHeader({ address, onIntent }: Props) {
    if (address) return <AuthenticatedSummary address={address} onIntent={onIntent} />;
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label={t`Portfolio account value`}
                className="rounded-lg px-2 py-1 text-left outline-none hover:bg-[#f5f5f9] focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'account' })}
            >
                <span className="block text-xs leading-[14px] text-[#b1b1b1]">
                    <Trans>Portfolio</Trans>
                </span>
                <span className="block text-sm font-semibold leading-5 text-[#4c4aa9]">$--</span>
            </button>
            <button
                type="button"
                aria-label={t`Withdrawable cash`}
                className="rounded-lg px-2 py-1 text-left outline-none hover:bg-[#f5f5f9] focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'account' })}
            >
                <span className="block text-xs leading-[14px] text-[#b1b1b1]">
                    <Trans>Cash</Trans>
                </span>
                <span className="block text-sm font-semibold leading-5 text-[#4c4aa9]">$--</span>
            </button>
            <button
                type="button"
                className="h-8 rounded-lg bg-lightTextMain px-5 text-[15px] font-bold leading-5 text-white outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                onClick={() => onIntent({ kind: 'deposit' })}
            >
                <Trans>Deposit</Trans>
            </button>
        </div>
    );
});
