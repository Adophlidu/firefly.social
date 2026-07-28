'use client';

import type { PerpsIntent } from '@dimensiondev/iframe-bridge';
import { type PerpsAddress, usePerpsComputedAccountValue } from '@dimensiondev/perps-react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { formatPerpsAccountBalance } from '@/components/Perps/formatPerpsAccountBalance.js';
import styles from '@/components/Perps/PerpsResponsive.module.css';

interface Props {
    address?: PerpsAddress;
    onIntent: (intent: PerpsIntent) => void;
}

function AuthenticatedSummary({ address, onIntent }: Required<Props>) {
    const { accountValue, withdrawable, isLoading } = usePerpsComputedAccountValue(address);
    return (
        <>
            <div className={styles.desktopAccountSummary}>
                <button
                    type="button"
                    aria-label={t`Portfolio account value`}
                    className="rounded-lg px-2 py-1 text-left outline-none hover:bg-lightBg focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block text-xs leading-[14px] text-third">
                        <Trans>Portfolio</Trans>
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-highlight">
                        {isLoading ? '$--' : formatPerpsAccountBalance(accountValue)}
                    </span>
                </button>
                <button
                    type="button"
                    aria-label={t`Withdrawable cash`}
                    className="rounded-lg px-2 py-1 text-left outline-none hover:bg-lightBg focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block text-xs leading-[14px] text-third">
                        <Trans>Cash</Trans>
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-highlight">
                        {isLoading ? '$--' : formatPerpsAccountBalance(withdrawable)}
                    </span>
                </button>
                <button
                    type="button"
                    className="h-8 rounded-lg bg-main px-5 text-[15px] font-bold leading-5 text-primaryBottom outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'deposit' })}
                >
                    <Trans>Deposit</Trans>
                </button>
            </div>
            <div className={styles.mobileAccountSummary}>
                <button
                    type="button"
                    aria-label={t`Portfolio account value`}
                    className={styles.mobileAccountButton}
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block truncate text-[11px] leading-[13px] text-third">
                        <Trans>Portfolio</Trans>
                    </span>
                    <span className="block truncate text-sm font-semibold leading-5 text-highlight">
                        {isLoading ? '$--' : formatPerpsAccountBalance(accountValue)}
                    </span>
                </button>
                <button
                    type="button"
                    className={styles.mobileDepositButton}
                    onClick={() => onIntent({ kind: 'deposit' })}
                >
                    <Trans>Deposit</Trans>
                </button>
            </div>
        </>
    );
}

export const PerpsAccountHeader = memo(function PerpsAccountHeader({ address, onIntent }: Props) {
    if (address) return <AuthenticatedSummary address={address} onIntent={onIntent} />;
    return (
        <>
            <div className={styles.desktopAccountSummary}>
                <button
                    type="button"
                    aria-label={t`Portfolio account value`}
                    className="rounded-lg px-2 py-1 text-left outline-none hover:bg-lightBg focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block text-xs leading-[14px] text-third">
                        <Trans>Portfolio</Trans>
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-highlight">$--</span>
                </button>
                <button
                    type="button"
                    aria-label={t`Withdrawable cash`}
                    className="rounded-lg px-2 py-1 text-left outline-none hover:bg-lightBg focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block text-xs leading-[14px] text-third">
                        <Trans>Cash</Trans>
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-highlight">$--</span>
                </button>
                <button
                    type="button"
                    className="h-8 rounded-lg bg-main px-5 text-[15px] font-bold leading-5 text-primaryBottom outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-highlight"
                    onClick={() => onIntent({ kind: 'deposit' })}
                >
                    <Trans>Deposit</Trans>
                </button>
            </div>
            <div className={styles.mobileAccountSummary}>
                <button
                    type="button"
                    aria-label={t`Portfolio account value`}
                    className={styles.mobileAccountButton}
                    onClick={() => onIntent({ kind: 'account' })}
                >
                    <span className="block text-[11px] leading-[13px] text-third">
                        <Trans>Portfolio</Trans>
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-highlight">$--</span>
                </button>
                <button
                    type="button"
                    className={styles.mobileDepositButton}
                    onClick={() => onIntent({ kind: 'deposit' })}
                >
                    <Trans>Deposit</Trans>
                </button>
            </div>
        </>
    );
});
