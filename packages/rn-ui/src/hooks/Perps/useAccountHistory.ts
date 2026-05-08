import type { UserNonFundingLedgerUpdatesResponse } from '@nktkas/hyperliquid/api/info';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';

import { formatAmount as formatNumericAmount } from '@/helpers/formatAmount';
import { infoClient } from '@/providers/client';
import type { AccountHistoryItem } from '@/types/ui';

type NonFundingLedgerUpdate = UserNonFundingLedgerUpdatesResponse[number];

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

function formatTimeAgo(time: number) {
    const diffMs = Math.max(Date.now() - time, 0);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getDisplayTitle(type: NonFundingLedgerUpdate['delta']['type'], positive: boolean) {
    switch (type) {
        case 'deposit':
            return 'Deposit';
        case 'withdraw':
            return 'Withdraw';
        case 'accountClassTransfer':
            return 'Account Transfer';
        case 'internalTransfer':
            return positive ? 'Receive' : 'Send';
        case 'subAccountTransfer':
            return positive ? 'Receive' : 'Send';
        case 'spotTransfer':
            return positive ? 'Receive' : 'Send';
        case 'vaultDeposit':
            return 'Vault Deposit';
        case 'vaultWithdraw':
            return 'Vault Withdraw';
        case 'vaultDistribution':
            return 'Vault Distribution';
        case 'liquidation':
            return 'Liquidation';
        case 'rewardsClaim':
            return 'Rewards Claim';
        case 'send':
            return positive ? 'Receive' : 'Send';
        default:
            return 'Account Update';
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

function mapToAccountHistoryItem(update: NonFundingLedgerUpdate, walletAddress?: string): AccountHistoryItem {
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
        title: getDisplayTitle(update.delta.type, positive),
        timeAgo: formatTimeAgo(update.time),
        amount: formatAmount(amountValue, positive),
    };
}

export function useAccountHistory({ walletAddress }: UseAccountHistoryParams) {
    return useQuery({
        queryKey: ['accountHistory', walletAddress],
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

            return dedupedByHash.map((update) => mapToAccountHistoryItem(update, walletAddress));
        },
    });
}
