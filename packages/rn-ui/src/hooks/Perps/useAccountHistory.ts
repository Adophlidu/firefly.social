import { useLingui } from '@lingui/react/macro';
import type { UserNonFundingLedgerUpdatesResponse } from '@nktkas/hyperliquid/api/info';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';

import { formatAmount as formatNumericAmount } from '@/helpers/formatAmount';
import { infoClient } from '@/providers/client';
import type { AccountHistoryItem } from '@/types/ui';

type NonFundingLedgerUpdate = UserNonFundingLedgerUpdatesResponse[number];
type I18n = ReturnType<typeof useLingui>['i18n'];

interface UseAccountHistoryParams {
    walletAddress?: string;
}

const NEGATIVE_TYPES = new Set(['withdraw', 'internalTransfer', 'subAccountTransfer', 'spotTransfer', 'vaultWithdraw']);

function isSameAddress(a?: string, b?: string) {
    if (!a || !b) return false;
    return a.toLowerCase() === b.toLowerCase();
}

function formatAmount(value?: string, positive = true) {
    const bnValue = new BigNumber(value || 0);
    const safeValue = bnValue.isNaN() || !bnValue.isFinite() ? new BigNumber(0) : bnValue.abs();
    const prefix = positive ? '+' : '-';
    return `${prefix}$${formatNumericAmount(safeValue)}`;
}

function formatTimeAgo(i18n: I18n, time: number) {
    const diffMs = Math.max(Date.now() - time, 0);
    const diffMinutes = Math.floor(diffMs / 60_000);
    if (diffMinutes < 1) return i18n._('rn-ui.accountHistory.justNow');
    if (diffMinutes < 60) return i18n._('rn-ui.accountHistory.minutesAgo', { count: diffMinutes });

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return i18n._('rn-ui.accountHistory.hoursAgo', { count: diffHours });

    const diffDays = Math.floor(diffHours / 24);
    return i18n._('rn-ui.accountHistory.daysAgo', { count: diffDays });
}

function getDisplayTitle(i18n: I18n, type: NonFundingLedgerUpdate['delta']['type'], positive: boolean) {
    switch (type) {
        case 'deposit':
            return i18n._('rn-ui.accountHistory.deposit');
        case 'withdraw':
            return i18n._('rn-ui.accountHistory.withdraw');
        case 'accountClassTransfer':
            return i18n._('rn-ui.accountHistory.accountTransfer');
        case 'internalTransfer':
        case 'subAccountTransfer':
        case 'spotTransfer':
            return positive ? i18n._('rn-ui.accountHistory.receive') : i18n._('rn-ui.accountHistory.send');
        case 'vaultDeposit':
            return i18n._('rn-ui.accountHistory.vaultDeposit');
        case 'vaultWithdraw':
            return i18n._('rn-ui.accountHistory.vaultWithdraw');
        case 'vaultDistribution':
            return i18n._('rn-ui.accountHistory.vaultDistribution');
        case 'liquidation':
            return i18n._('rn-ui.accountHistory.liquidation');
        case 'rewardsClaim':
            return i18n._('rn-ui.accountHistory.rewardsClaim');
        case 'send':
            return positive ? i18n._('rn-ui.accountHistory.receive') : i18n._('rn-ui.accountHistory.send');
        default:
            return i18n._('rn-ui.accountHistory.accountUpdate');
    }
}

function getAmountValue(update: NonFundingLedgerUpdate) {
    const { delta } = update;
    if (delta.type === 'spotTransfer' && 'usdcValue' in delta && typeof delta.usdcValue === 'string') {
        return delta.usdcValue;
    }
    if (delta.type === 'vaultWithdraw' && 'netWithdrawnUsd' in delta && typeof delta.netWithdrawnUsd === 'string') {
        return delta.netWithdrawnUsd;
    }
    if (delta.type === 'vaultWithdraw' && 'requestedUsd' in delta && typeof delta.requestedUsd === 'string') {
        return delta.requestedUsd;
    }
    if (delta.type === 'liquidation' && 'accountValue' in delta && typeof delta.accountValue === 'string') {
        return delta.accountValue;
    }
    if ('usdc' in delta && typeof delta.usdc === 'string') return delta.usdc;
    if ('amount' in delta && typeof delta.amount === 'string') return delta.amount;
    return '0';
}

function isPositiveUpdate(update: NonFundingLedgerUpdate, walletAddress?: string) {
    const { delta } = update;
    if (delta.type === 'accountClassTransfer') {
        return delta.toPerp;
    }
    if (delta.type === 'cStakingTransfer') {
        return delta.isDeposit;
    }
    if (delta.type === 'borrowLend') {
        return delta.operation === 'borrow' || delta.operation === 'withdraw';
    }
    if (
        (delta.type === 'send' ||
            delta.type === 'internalTransfer' ||
            delta.type === 'subAccountTransfer' ||
            delta.type === 'spotTransfer') &&
        walletAddress
    ) {
        if (isSameAddress(delta.destination, walletAddress)) {
            return true;
        }
        if (isSameAddress(delta.user, walletAddress)) {
            return false;
        }
    }
    return !NEGATIVE_TYPES.has(delta.type);
}

function mapToAccountHistoryItem(
    i18n: I18n,
    update: NonFundingLedgerUpdate,
    walletAddress?: string,
): AccountHistoryItem {
    const positive = isPositiveUpdate(update, walletAddress);
    const delta = update.delta;
    let amountValue = getAmountValue(update);

    if (
        positive &&
        (delta.type === 'internalTransfer' || delta.type === 'subAccountTransfer' || delta.type === 'spotTransfer') &&
        'fee' in delta &&
        typeof delta.fee === 'string' &&
        delta.fee
    ) {
        amountValue = new BigNumber(amountValue).minus(delta.fee).toFixed();
    }

    return {
        id: `${update.hash}-${update.time}`,
        type: positive ? 'addFunds' : 'withdraw',
        title: getDisplayTitle(i18n, update.delta.type, positive),
        timeAgo: formatTimeAgo(i18n, update.time),
        amount: formatAmount(amountValue, positive),
    };
}

export function useAccountHistory({ walletAddress }: UseAccountHistoryParams) {
    const { i18n } = useLingui();
    return useQuery({
        queryKey: ['accountHistory', walletAddress, i18n.locale],
        enabled: Boolean(walletAddress),
        queryFn: async () => {
            if (!walletAddress) return [];

            const updates = await infoClient.userNonFundingLedgerUpdates({
                user: walletAddress as `0x${string}`,
            });

            const dedupedByHash = [...updates]
                .sort((a, b) => b.time - a.time)
                .filter((update, index, arr) => {
                    return arr.findIndex((item) => item.hash === update.hash) === index;
                });

            return dedupedByHash.map((update) => mapToAccountHistoryItem(i18n, update, walletAddress));
        },
    });
}
