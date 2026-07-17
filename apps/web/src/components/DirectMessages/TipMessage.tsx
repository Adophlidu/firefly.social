'use client';

import DollarIcon from '@dimensiondev/assets/dollar.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { useDmInteractiveAction } from '@/hooks/useDirectMessages.js';

interface TipMessageProps {
    account: string;
    interactiveActionId: string;
    isSelf: boolean;
}

function formatAmount(value: number) {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/\.?0+$/u, '');
}

export const TipMessage = memo(function TipMessage({ account, interactiveActionId, isSelf }: TipMessageProps) {
    const detailQuery = useDmInteractiveAction(account, interactiveActionId);
    const detail = detailQuery.data;
    const normalizedStatus = detail?.status?.toUpperCase() ?? '';
    const isCompleted = normalizedStatus === 'ACCEPTED' || normalizedStatus === 'COMPLETED';
    const isPending = normalizedStatus === 'PENDING' || normalizedStatus === 'ACTIVE' || normalizedStatus === 'UPDATED';
    const isInactive = ['DECLINED', 'CANCELLED', 'REFUNDED', 'EXPIRED'].includes(normalizedStatus);
    const amount = detail?.amount;
    const symbol = detail?.currencySymbol;
    const hasAmount = typeof amount === 'number' && Boolean(symbol);
    const subtitle = !isSelf && isCompleted ? t`Received` : isPending ? t`Requested` : t`Sent`;
    const status = detail?.message
        ? detail.message
        : isPending
          ? t`Pending`
          : normalizedStatus === 'DECLINED'
            ? t`Declined`
            : normalizedStatus === 'CANCELLED'
              ? t`Cancelled`
              : normalizedStatus === 'REFUNDED'
                ? t`Refunded`
                : normalizedStatus === 'EXPIRED'
                  ? t`Expired`
                  : isSelf || isCompleted
                    ? t`Paid`
                    : null;

    return (
        <div className="flex h-[286px] w-[min(72vw,320px)] flex-col overflow-hidden rounded-xl border border-line bg-lightBg p-5 text-main">
            {detailQuery.isLoading ? (
                <div className="flex h-full animate-pulse flex-col" aria-label={t`Loading payment request`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="h-4 w-20 rounded bg-line" />
                            <div className="mt-2 h-3 w-16 rounded bg-line" />
                        </div>
                        <div className="size-10 rounded-lg bg-line" />
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <div className="h-12 w-28 rounded-lg bg-line" />
                        <div className="h-4 w-20 rounded bg-line" />
                    </div>
                    <div className="border-t border-line pt-4">
                        <div className="h-3 w-12 rounded bg-line" />
                        <div className="mt-2 h-4 w-20 rounded bg-line" />
                    </div>
                </div>
            ) : detail ? (
                <>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-base font-bold">
                                <Trans>Payment</Trans>
                            </p>
                            <p className="mt-0.5 text-sm text-second">{subtitle}</p>
                        </div>
                        <span
                            className={classNames('grid size-10 place-items-center rounded-lg', {
                                'bg-green-500/10 text-green-500': isCompleted && !isSelf,
                                'bg-fireflyBrand/10 text-fireflyBrand': !isCompleted || isSelf,
                            })}
                        >
                            <DollarIcon width={22} height={22} />
                        </span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center">
                        {hasAmount && typeof amount === 'number' ? (
                            <>
                                <p
                                    className={classNames('max-w-full truncate text-5xl font-bold tracking-tight', {
                                        'text-green-500': isCompleted && !isSelf,
                                        'text-second': isInactive,
                                    })}
                                >
                                    {!isSelf && isCompleted ? '+' : ''}${formatAmount(amount)}
                                </p>
                                <p className="mt-2 max-w-full truncate text-sm font-medium text-second">
                                    {formatAmount(amount)} ${symbol}
                                </p>
                            </>
                        ) : (
                            <p className="text-center text-sm font-semibold text-second">
                                {isSelf ? <Trans>Payment request sent</Trans> : <Trans>Payment requested</Trans>}
                            </p>
                        )}
                    </div>
                    <div className="border-t border-line pt-4">
                        <p className="text-xs font-semibold text-second">
                            {detail.message ? <Trans>Message</Trans> : <Trans>Status</Trans>}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-main">{status ?? '—'}</p>
                    </div>
                </>
            ) : (
                <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-base font-bold">
                                <Trans>Payment</Trans>
                            </p>
                            <p className="mt-0.5 text-sm text-second">
                                {isSelf ? <Trans>Sent</Trans> : <Trans>Requested</Trans>}
                            </p>
                        </div>
                        <span className="bg-fireflyBrand/10 grid size-10 place-items-center rounded-lg text-fireflyBrand">
                            <DollarIcon width={22} height={22} />
                        </span>
                    </div>
                    <p className="m-auto max-w-48 text-center text-sm font-semibold leading-6 text-second">
                        <Trans>Payment request details unavailable</Trans>
                    </p>
                </div>
            )}
        </div>
    );
});
