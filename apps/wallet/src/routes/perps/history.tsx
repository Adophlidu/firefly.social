import type { PerpsClient } from '@dimensiondev/perps-core';
import { usePerpsClient } from '@dimensiondev/perps-react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { memo, useMemo, useState } from 'react';

import AccountDepositIcon from '@/assets/perps-history/deposit.svg';
import AccountWithdrawIcon from '@/assets/perps-history/withdraw.svg';
import BackIcon from '@/assets/perps-profile/back.svg';
import BtcIcon from '@/assets/perps-profile/btc.svg';
import { NavigationBar } from '@/components/NavigationBar.js';
import { toPerpsCoinDisplayName } from '@/components/Perps/perpsCoin.js';
import { useCachedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';
import { cn } from '@/lib/utils.js';

type Fill = Awaited<ReturnType<PerpsClient['info']['userFills']>>[number];
type LedgerUpdate = Awaited<ReturnType<PerpsClient['info']['userNonFundingLedgerUpdates']>>[number];

const tradingDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    year: 'numeric',
});

function formatUSD(value: BigNumber.Value, fractionDigits = 2) {
    const number = new BigNumber(value);
    if (!number.isFinite()) return '--';
    return `$${number.abs().toFormat(fractionDigits)}`;
}

function formatTradingDate(time: number) {
    return tradingDateFormatter.format(new Date(time));
}

function formatRelativeTime(time: number) {
    const elapsedSeconds = Math.round((time - Date.now()) / 1_000);
    const intervals = [
        { limit: 60, seconds: 1, unit: 'second' },
        { limit: 60, seconds: 60, unit: 'minute' },
        { limit: 24, seconds: 3_600, unit: 'hour' },
        { limit: 7, seconds: 86_400, unit: 'day' },
        { limit: 5, seconds: 604_800, unit: 'week' },
        { limit: 12, seconds: 2_629_800, unit: 'month' },
        { limit: Number.POSITIVE_INFINITY, seconds: 31_557_600, unit: 'year' },
    ] as const;

    let value = elapsedSeconds;
    let unit: Intl.RelativeTimeFormatUnit = 'second';
    for (const interval of intervals) {
        value = Math.round(elapsedSeconds / interval.seconds);
        unit = interval.unit;
        if (Math.abs(value) < interval.limit) break;
    }

    return new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(value, unit);
}

function ledgerPresentation(update: LedgerUpdate) {
    const { delta } = update;
    const amount =
        'usdc' in delta
            ? delta.usdc
            : 'amount' in delta
              ? delta.amount
              : 'netWithdrawnUsd' in delta
                ? delta.netWithdrawnUsd
                : 'accountValue' in delta
                  ? delta.accountValue
                  : '0';
    const isWithdrawal =
        delta.type === 'withdraw' ||
        delta.type === 'vaultWithdraw' ||
        (delta.type === 'accountClassTransfer' && !delta.toPerp) ||
        (delta.type === 'cStakingTransfer' && !delta.isDeposit) ||
        (delta.type === 'borrowLend' && delta.operation === 'withdraw');

    return {
        amount: `${isWithdrawal ? '-' : '+'}${formatUSD(amount)}`,
        isWithdrawal,
        label: isWithdrawal ? t`Withdraw` : t`Add Funds`,
    };
}

const TradingHistoryCard = memo(function TradingHistoryCard({ fill }: { fill: Fill }) {
    const pnl = new BigNumber(fill.closedPnl || '0');
    const showPnl = !pnl.isZero();

    return (
        <article className="rounded-xl border border-[#f5f5f5] bg-white p-4 text-lightTextMain dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
            <div className="flex items-center gap-2">
                <BtcIcon className="size-9 shrink-0" />
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold leading-5">
                        {toPerpsCoinDisplayName(fill.coin)}USDC
                    </h2>
                    <p className="text-xs leading-[14px] text-[#767676]">{fill.dir}</p>
                </div>
                {showPnl ? (
                    <strong
                        className={cn(
                            'shrink-0 text-sm font-semibold leading-5',
                            pnl.isPositive() ? 'text-[#3dc233]' : 'text-[#ff3545]',
                        )}
                    >
                        {pnl.isPositive() ? '+' : '-'}
                        {formatUSD(pnl)}
                    </strong>
                ) : null}
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2">
                <HistoryMetric label={<Trans>Price</Trans>} value={`$${new BigNumber(fill.px).toFormat()}`} />
                <HistoryMetric label={<Trans>Position Size</Trans>} value={new BigNumber(fill.sz).toFormat()} />
                <HistoryMetric
                    align="right"
                    label={<Trans>Trade Value</Trans>}
                    value={formatUSD(new BigNumber(fill.px).multipliedBy(fill.sz))}
                />
            </dl>
            <time className="mt-3 block text-xs leading-[14px] text-[#767676]">{formatTradingDate(fill.time)}</time>
        </article>
    );
});

const AccountActivityCard = memo(function AccountActivityCard({ update }: { update: LedgerUpdate }) {
    const presentation = ledgerPresentation(update);
    const ActivityIcon = presentation.isWithdrawal ? AccountWithdrawIcon : AccountDepositIcon;

    return (
        <article className="flex items-center gap-2 rounded-xl border border-[#f5f5f5] bg-white p-3 text-lightTextMain dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
            <ActivityIcon className="size-10 shrink-0" />
            <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold leading-5">{presentation.label}</h2>
                <time className="block text-xs leading-[14px] text-[#767676]">{formatRelativeTime(update.time)}</time>
            </div>
            <strong
                className={cn(
                    'shrink-0 text-sm font-semibold leading-5',
                    presentation.isWithdrawal ? 'text-[#ff3545]' : 'text-[#3dc233]',
                )}
            >
                {presentation.amount}
            </strong>
        </article>
    );
});

export default PerpsHistory;

function PerpsHistory() {
    const client = usePerpsClient();
    const address = useCachedEvmAddress() as `0x${string}` | null;
    const [tab, setTab] = useState<'trading' | 'account'>('trading');
    const fills = useQuery({
        queryKey: ['hyperliquid', 'perps-history', 'fills', address],
        enabled: Boolean(address),
        queryFn: () => client.info.userFills({ user: address!, aggregateByTime: true }),
    });
    const ledger = useQuery({
        queryKey: ['hyperliquid', 'perps-history', 'ledger', address],
        enabled: Boolean(address),
        queryFn: () => client.info.userNonFundingLedgerUpdates({ user: address! }),
    });
    const ledgerData = useMemo(() => [...(ledger.data ?? [])].sort((a, b) => b.time - a.time), [ledger.data]);
    const isLoading = tab === 'trading' ? fills.isLoading : ledger.isLoading;
    const isEmpty = tab === 'trading' ? !fills.data?.length : !ledgerData.length;

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white text-lightTextMain dark:bg-neutral-950 dark:text-neutral-50">
            <NavigationBar className="shrink-0 font-[Poppins] leading-6" backIcon={<BackIcon className="size-6" />}>
                <Trans>History</Trans>
            </NavigationBar>

            <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6">
                <div role="tablist" aria-label={t`Perpetuals history`} className="flex w-full">
                    <HistoryTab selected={tab === 'trading'} onClick={() => setTab('trading')}>
                        <Trans>Trading History</Trans>
                    </HistoryTab>
                    <HistoryTab selected={tab === 'account'} onClick={() => setTab('account')}>
                        <Trans>Account Activities</Trans>
                    </HistoryTab>
                </div>

                <div className="mt-4 space-y-4">
                    {isLoading ? (
                        <p className="py-12 text-center text-sm text-[#767676]">
                            <Trans>Loading…</Trans>
                        </p>
                    ) : null}
                    {!isLoading && isEmpty ? (
                        <p className="py-12 text-center text-sm text-[#767676]">
                            <Trans>No history yet</Trans>
                        </p>
                    ) : null}
                    {tab === 'trading'
                        ? fills.data?.map((fill) => (
                              <TradingHistoryCard key={`${fill.oid}-${fill.hash}-${fill.time}`} fill={fill} />
                          ))
                        : null}
                    {tab === 'account'
                        ? ledgerData.map((update) => (
                              <AccountActivityCard key={`${update.hash}-${update.time}`} update={update} />
                          ))
                        : null}
                </div>
            </main>
        </div>
    );
}

function HistoryTab({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick(): void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={selected}
            className="h-9 flex-1 border-b-[2.5px] border-transparent px-1 font-[Poppins] text-base font-semibold leading-6 text-[#767676] aria-selected:border-lightTextMain aria-selected:text-lightTextMain dark:aria-selected:border-neutral-50 dark:aria-selected:text-neutral-50"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function HistoryMetric({
    label,
    value,
    align = 'left',
}: {
    label: React.ReactNode;
    value: string;
    align?: 'left' | 'right';
}) {
    return (
        <div className={cn('min-w-0', align === 'right' && 'text-right')}>
            <dd className="truncate text-sm font-semibold leading-5">{value}</dd>
            <dt className="truncate text-xs font-medium leading-[14px] text-[#767676]">{label}</dt>
        </div>
    );
}
