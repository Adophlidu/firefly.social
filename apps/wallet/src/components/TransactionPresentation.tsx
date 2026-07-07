import ClipboardTextIcon from '@dimensiondev/assets/clipboard-text.svg';
import Receive from '@dimensiondev/assets/download1.svg';
import Interaction from '@dimensiondev/assets/interaction.svg';
import Revoke from '@dimensiondev/assets/revoke.svg';
import Send from '@dimensiondev/assets/send1.svg';
import Approve from '@dimensiondev/assets/tick-circle.svg';
import { NetworkType } from '@dimensiondev/enums';
import { runInSafe, safeUnreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { formatAddress, getBlockExplorersURL } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { Image } from '@/components/Image.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isUnlimitedApproval } from '@/helpers/isUnlimitedApproval.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    type TransactionHistoryTokenAction,
    TransactionState,
} from '@/providers/types/Firefly.js';

export type TransactionAssetLabel = 'received' | 'sent' | 'approved' | 'revoked';

export interface TransactionAssetRowPresentation {
    id: string;
    label: TransactionAssetLabel;
    tokenLogo?: string | null;
    tokenSymbol?: string | null;
    tokenName?: string | null;
    chainId: number;
    amountText?: ReactNode | null;
    amountPrefix?: '+' | '-' | '';
    amountClassName?: string;
    showLabelMarginTop?: boolean;
    address?: string;
    amount?: string;
    price?: string;
}

export interface TransactionAmountPresentation {
    id: string;
    text: ReactNode;
    symbol?: string;
    prefix?: '+' | '-';
    className?: string;
    title?: string;
    compact?: boolean;
}

export type TransactionAssetEffectPresentation = {
    type: 'amounts';
    amounts: TransactionAmountPresentation[];
} | null;

export type TransactionListSubtitlePresentation =
    | {
          type: 'plain-address';
          address?: string;
      }
    | {
          type: 'to-address';
          text?: string;
      }
    | {
          type: 'from-address';
          text?: string;
      }
    | {
          type: 'with-address';
          text?: string;
      }
    | {
          type: 'on-project';
          projectName?: string;
          fallbackAddress?: string;
      }
    | {
          type: 'via-project';
          projectName?: string;
          fallbackAddress?: string;
      }
    | null;

export type TransactionIconPresentation =
    | {
          type: 'pair';
          sentToken: TransactionHistoryTokenAction;
          receivedToken: TransactionHistoryTokenAction;
      }
    | {
          type: 'token';
          icon?: string | null;
          symbol?: string;
          name?: string;
          disableBadge?: boolean;
      }
    | {
          type: 'document';
      };

export type TransactionSubtitleTargetPresentation =
    | {
          type: 'from-wallet';
          address?: string;
      }
    | {
          type: 'to-wallet';
          address?: string;
      }
    | {
          type: 'project';
          address?: string;
          logo?: string | null;
          name?: string;
          rawText?: string;
      }
    | {
          type: 'contract';
          address?: string;
          logo?: string | null;
      }
    | null;

export interface TransactionPresentation {
    chainId: number;
    networkType: NetworkType;
    isSolana: boolean;
    fromAddress?: string;
    toAddress?: string;
    contractAddress?: string;
    profileAddress?: string;
    explorerUrl?: string;
    primaryToken?: TransactionHistoryTokenAction;
    icon: TransactionIconPresentation;
    assetEffect: TransactionAssetEffectPresentation;
    listSubtitle: TransactionListSubtitlePresentation;
    assetRows: TransactionAssetRowPresentation[];
    subtitleTarget: TransactionSubtitleTargetPresentation;
}

function first<T>(items: T[] | undefined) {
    return items?.[0];
}

function formatOptionalAddress(address: string | undefined) {
    return address ? formatAddress(address, 4) : undefined;
}

export function formatTransactionAmount(amount: string | undefined) {
    return renderShrankPrice(formatPrice(amount) ?? '-');
}

function buildAmountPresentation({
    id,
    amount,
    symbol,
    prefix,
    className,
    title,
    compact,
}: {
    id: string;
    amount?: string;
    symbol?: string;
    prefix?: '+' | '-';
    className?: string;
    title?: string;
    compact?: boolean;
}): TransactionAmountPresentation {
    return {
        id,
        text: formatTransactionAmount(amount),
        symbol,
        prefix,
        className,
        title,
        compact,
    };
}

function buildTokenAssetRow({
    id,
    label,
    chainId,
    tokenAction,
    amountPrefix,
    amountClassName,
    showLabelMarginTop,
}: {
    id: string;
    label: TransactionAssetLabel;
    chainId: number;
    tokenAction: TransactionHistoryTokenAction;
    amountPrefix: '+' | '-';
    amountClassName: string;
    showLabelMarginTop?: boolean;
}): TransactionAssetRowPresentation {
    return {
        id,
        label,
        chainId,
        tokenLogo: tokenAction.token.logo ?? null,
        tokenSymbol: tokenAction.token.symbol ?? null,
        tokenName: tokenAction.token.name ?? null,
        amountText: tokenAction.amount ? formatTransactionAmount(tokenAction.amount) : null,
        amountPrefix,
        amountClassName,
        showLabelMarginTop,
        amount: tokenAction.amount,
        price: tokenAction.token.price,
        address: tokenAction.token.address,
    };
}

export function getTransactionExplorerUrl(transaction: TransactionHistoryItem) {
    if (!transaction.hash) return;
    return runInSafe(() => getBlockExplorersURL(transaction.chain_id, transaction.hash, 'tx')) || undefined;
}

export function buildTransactionPresentation(transaction: TransactionHistoryItem): TransactionPresentation {
    const chainId = transaction.chain_id;
    const isSolana = chainId === solana.id;
    const networkType = isSolana ? NetworkType.Solana : NetworkType.Ethereum;
    const sentToken = first(transaction.token_sends);
    const receivedToken = first(transaction.token_receives);
    const primaryToken = receivedToken || sentToken;

    const fromAddress = transaction.from_address || primaryToken?.sender || undefined;
    const toAddress =
        transaction.category === TransactionHistoryCategory.TokenSend
            ? primaryToken?.recipient || transaction.to_address || undefined
            : transaction.to_address || primaryToken?.recipient || undefined;
    const contractAddress = transaction.to_address || toAddress;

    const assetEffect = buildTransactionAssetEffect(transaction, primaryToken);
    const listSubtitle = buildTransactionListSubtitle(transaction, isSolana, fromAddress, toAddress, primaryToken);
    const assetRows = buildTransactionAssetRows(transaction, chainId, sentToken, receivedToken);
    const subtitleTarget = buildTransactionSubtitleTarget(transaction, fromAddress, toAddress);

    return {
        chainId,
        networkType,
        isSolana,
        fromAddress,
        toAddress,
        contractAddress,
        profileAddress: fromAddress,
        explorerUrl: getTransactionExplorerUrl(transaction),
        primaryToken,
        icon: buildTransactionIcon(transaction, isSolana, primaryToken),
        assetEffect,
        listSubtitle,
        assetRows,
        subtitleTarget,
    };
}

function buildTransactionAssetEffect(
    transaction: TransactionHistoryItem,
    primaryToken: TransactionHistoryTokenAction | undefined,
): TransactionAssetEffectPresentation {
    if (
        transaction.category === TransactionHistoryCategory.TokenSwap ||
        transaction.category === TransactionHistoryCategory.ContractInteraction ||
        transaction.category === TransactionHistoryCategory.TokenBridge
    ) {
        const amounts: TransactionAmountPresentation[] = [];
        const receivedToken = first(transaction.token_receives);
        const sentToken = first(transaction.token_sends);
        if (receivedToken) {
            amounts.push(
                buildAmountPresentation({
                    id: 'received',
                    amount: receivedToken.amount,
                    symbol: receivedToken.token.symbol,
                    prefix: '+',
                    className: 'text-success',
                }),
            );
        }
        if (sentToken) {
            amounts.push(
                buildAmountPresentation({
                    id: 'sent',
                    amount: sentToken.amount,
                    symbol: sentToken.token.symbol,
                    prefix: '-',
                    compact: !!receivedToken,
                }),
            );
        }
        return amounts.length ? { type: 'amounts', amounts } : null;
    }

    if (transaction.category === TransactionHistoryCategory.TokenRevoke) {
        if (!transaction.token_approve) return null;
        return {
            type: 'amounts',
            amounts: [
                {
                    id: 'revoked-token',
                    text: transaction.token_approve.token.symbol,
                },
            ],
        };
    }

    if (transaction.category === TransactionHistoryCategory.TokenApprove) {
        if (!transaction.token_approve) return null;
        const { amount, token } = transaction.token_approve;
        return {
            type: 'amounts',
            amounts: [
                {
                    id: 'approved-token',
                    text: isUnlimitedApproval(amount) ? <Trans>Unlimited</Trans> : formatTransactionAmount(amount),
                    symbol: token.symbol,
                    title: `${formatPrice(amount) ?? ''} ${token.symbol}`,
                },
            ],
        };
    }

    if (!primaryToken) return null;

    if (transaction.category === TransactionHistoryCategory.TokenReceive) {
        return {
            type: 'amounts',
            amounts: [
                buildAmountPresentation({
                    id: 'received',
                    amount: primaryToken.amount,
                    symbol: primaryToken.token.symbol,
                    prefix: '+',
                    className: 'text-success',
                }),
            ],
        };
    }

    if (transaction.category === TransactionHistoryCategory.TokenSend) {
        return {
            type: 'amounts',
            amounts: [
                buildAmountPresentation({
                    id: 'sent',
                    amount: primaryToken.amount,
                    symbol: primaryToken.token.symbol,
                    prefix: '-',
                }),
            ],
        };
    }

    return {
        type: 'amounts',
        amounts: [
            buildAmountPresentation({
                id: 'token',
                amount: primaryToken.amount,
                symbol: primaryToken.token.symbol,
            }),
        ],
    };
}

function buildTransactionListSubtitle(
    transaction: TransactionHistoryItem,
    isSolana: boolean,
    fromAddress: string | undefined,
    toAddress: string | undefined,
    primaryToken: TransactionHistoryTokenAction | undefined,
): TransactionListSubtitlePresentation {
    switch (transaction.category) {
        case TransactionHistoryCategory.TokenApprove:
        case TransactionHistoryCategory.TokenRevoke:
            return {
                type: 'plain-address',
                address: isSolana
                    ? transaction.to_address
                    : transaction.token_approve?.spender_address || transaction.to_address,
            };
        case TransactionHistoryCategory.TokenSwap:
            return {
                type: 'on-project',
                projectName: transaction.project_name,
                fallbackAddress: transaction.to_address,
            };
        case TransactionHistoryCategory.TokenBridge:
            return {
                type: 'via-project',
                projectName: transaction.project_name,
                fallbackAddress: transaction.to_address,
            };
        case TransactionHistoryCategory.ContractInteraction:
            return {
                type: 'with-address',
                text:
                    transaction.project_name ||
                    formatOptionalAddress(isSolana ? primaryToken?.recipient || toAddress : toAddress),
            };
        case TransactionHistoryCategory.TokenSend:
            return {
                type: 'to-address',
                text: formatOptionalAddress(primaryToken?.recipient || toAddress),
            };
        case TransactionHistoryCategory.TokenReceive:
            return {
                type: 'from-address',
                text: formatOptionalAddress(isSolana ? primaryToken?.sender || fromAddress : fromAddress),
            };
        default:
            safeUnreachable(transaction.category);
            return null;
    }
}

function buildTransactionIcon(
    transaction: TransactionHistoryItem,
    isSolana: boolean,
    primaryToken: TransactionHistoryTokenAction | undefined,
): TransactionIconPresentation {
    if (transaction.category === TransactionHistoryCategory.TokenApprove) {
        const token = transaction.token_approve?.token;
        return {
            type: 'token',
            icon: token?.logo,
            symbol: token?.symbol,
            name: token?.name,
            disableBadge: isSolana,
        };
    }

    if (
        (transaction.category === TransactionHistoryCategory.TokenSwap ||
            transaction.category === TransactionHistoryCategory.ContractInteraction ||
            transaction.category === TransactionHistoryCategory.TokenBridge) &&
        transaction.token_receives[0] &&
        transaction.token_sends[0]
    ) {
        return {
            type: 'pair',
            sentToken: transaction.token_sends[0],
            receivedToken: transaction.token_receives[0],
        };
    }

    if (transaction.category === TransactionHistoryCategory.TokenBridge) {
        const relatedToken = primaryToken;
        return {
            type: 'token',
            icon: transaction.project_logo || relatedToken?.token.logo || undefined,
            symbol: relatedToken?.token.symbol,
            name: transaction.project_name || relatedToken?.token.name,
            disableBadge: isSolana,
        };
    }

    if (transaction.category === TransactionHistoryCategory.ContractInteraction) {
        const icon =
            transaction.project_logo || primaryToken?.token.logo || transaction.token_approve?.token.logo || undefined;
        const symbol = primaryToken?.token.symbol || transaction.token_approve?.token.symbol;
        const name = transaction.project_name || primaryToken?.token.name || transaction.token_approve?.token.name;
        if (!icon && !symbol && !name) return { type: 'document' };
        return {
            type: 'token',
            icon,
            symbol,
            name,
            disableBadge: isSolana,
        };
    }

    return {
        type: 'token',
        icon: primaryToken?.token.logo,
        symbol: primaryToken?.token.symbol,
        name: primaryToken?.token.name,
        disableBadge: isSolana,
    };
}

function buildTransactionAssetRows(
    transaction: TransactionHistoryItem,
    chainId: number,
    sentToken: TransactionHistoryTokenAction | undefined,
    receivedToken: TransactionHistoryTokenAction | undefined,
): TransactionAssetRowPresentation[] {
    switch (transaction.category) {
        case TransactionHistoryCategory.TokenReceive:
            return receivedToken
                ? [
                      buildTokenAssetRow({
                          id: 'received',
                          label: 'received',
                          chainId,
                          tokenAction: receivedToken,
                          amountPrefix: '+',
                          amountClassName: 'text-success',
                      }),
                  ]
                : [];
        case TransactionHistoryCategory.TokenSend:
            return sentToken
                ? [
                      buildTokenAssetRow({
                          id: 'sent',
                          label: 'sent',
                          chainId,
                          tokenAction: sentToken,
                          amountPrefix: '-',
                          amountClassName: 'text-main',
                      }),
                  ]
                : [];
        case TransactionHistoryCategory.TokenApprove: {
            const tokenApprove = transaction.token_approve;
            const token = tokenApprove?.token;
            if (!token) return [];
            const amountText = tokenApprove?.amount ? (
                isUnlimitedApproval(tokenApprove.amount) ? (
                    <Trans>Unlimited</Trans>
                ) : (
                    formatTransactionAmount(tokenApprove.amount)
                )
            ) : null;
            return [
                {
                    id: 'approved',
                    label: 'approved',
                    chainId,
                    tokenLogo: token.logo ?? null,
                    tokenSymbol: token.symbol ?? null,
                    tokenName: token.name ?? null,
                    amountText,
                    amountPrefix: '',
                    amountClassName: 'text-main',
                    price: token.price,
                    address: token.address,
                },
            ];
        }
        case TransactionHistoryCategory.TokenRevoke: {
            const tokenApprove = transaction.token_approve;
            const token = tokenApprove?.token;
            if (!token) return [];
            return [
                {
                    id: 'revoked',
                    label: 'revoked',
                    chainId,
                    tokenLogo: token.logo ?? null,
                    tokenSymbol: token.symbol ?? null,
                    tokenName: token.name ?? null,
                    amountText: tokenApprove?.amount ? (
                        isUnlimitedApproval(tokenApprove.amount) ? (
                            <Trans>Unlimited {token.symbol}</Trans>
                        ) : (
                            formatTransactionAmount(tokenApprove.amount)
                        )
                    ) : null,
                    amountPrefix: '',
                    amountClassName: 'text-main',
                    price: token.price,
                    address: token.address,
                },
            ];
        }
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenBridge: {
            const rows: TransactionAssetRowPresentation[] = [];
            if (sentToken) {
                rows.push(
                    buildTokenAssetRow({
                        id: 'sent',
                        label: 'sent',
                        chainId,
                        tokenAction: sentToken,
                        amountPrefix: '-',
                        amountClassName: 'text-main',
                    }),
                );
            }
            if (receivedToken) {
                rows.push(
                    buildTokenAssetRow({
                        id: 'received',
                        label: 'received',
                        chainId,
                        tokenAction: receivedToken,
                        amountPrefix: '+',
                        amountClassName: 'text-success',
                        showLabelMarginTop: !!sentToken,
                    }),
                );
            }
            return rows;
        }
        default:
            safeUnreachable(transaction.category);
            return [];
    }
}

function buildTransactionSubtitleTarget(
    transaction: TransactionHistoryItem,
    fromAddress: string | undefined,
    toAddress: string | undefined,
): TransactionSubtitleTargetPresentation {
    switch (transaction.category) {
        case TransactionHistoryCategory.TokenReceive:
            return { type: 'from-wallet', address: fromAddress };
        case TransactionHistoryCategory.TokenSend:
            return { type: 'to-wallet', address: toAddress };
        case TransactionHistoryCategory.TokenApprove:
            return {
                type: 'project',
                address: transaction.token_approve?.spender_address || toAddress,
                logo: transaction.project_logo,
                name: transaction.project_name,
            };
        case TransactionHistoryCategory.TokenRevoke:
            return {
                type: 'project',
                address: transaction.token_approve?.spender_address || toAddress,
                logo: transaction.project_logo,
                rawText: transaction.token_approve?.spender_address,
            };
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenBridge:
            return {
                type: 'contract',
                address: toAddress,
                logo:
                    transaction.project_logo ||
                    first(transaction.token_sends)?.token.logo ||
                    first(transaction.token_receives)?.token.logo ||
                    transaction.token_approve?.token.logo,
            };
        default:
            safeUnreachable(transaction.category);
            return null;
    }
}

export function TransactionCategoryIcon({ category }: { category: TransactionHistoryCategory }) {
    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Receive className="size-3" />;
        case TransactionHistoryCategory.TokenSend:
            return <Send className="size-3" />;
        case TransactionHistoryCategory.TokenApprove:
            return <Approve className="size-3" />;
        case TransactionHistoryCategory.TokenRevoke:
            return <Revoke className="size-3" />;
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.TokenBridge:
            return <Interaction className="size-3" />;
        default:
            safeUnreachable(category);
            return <Interaction className="size-3" />;
    }
}

export function TransactionCategoryLabel({
    category,
    state,
}: {
    category: TransactionHistoryCategory;
    state: TransactionState;
}) {
    if (state === TransactionState.Failed) {
        switch (category) {
            case TransactionHistoryCategory.TokenReceive:
                return <Trans>Received Failed</Trans>;
            case TransactionHistoryCategory.TokenSend:
                return <Trans>Sent Failed</Trans>;
            case TransactionHistoryCategory.TokenSwap:
                return <Trans>Swapped Failed</Trans>;
            case TransactionHistoryCategory.TokenApprove:
                return <Trans>Approved Failed</Trans>;
            case TransactionHistoryCategory.TokenRevoke:
                return <Trans>Revoked Failed</Trans>;
            case TransactionHistoryCategory.ContractInteraction:
                return <Trans>Interacted Failed</Trans>;
            case TransactionHistoryCategory.TokenBridge:
                return <Trans>Bridged Failed</Trans>;
            default:
                safeUnreachable(category);
                return null;
        }
    }

    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Trans>Received</Trans>;
        case TransactionHistoryCategory.TokenSend:
            return <Trans>Sent</Trans>;
        case TransactionHistoryCategory.TokenSwap:
            return <Trans>Swapped</Trans>;
        case TransactionHistoryCategory.TokenApprove:
            return <Trans>Approved</Trans>;
        case TransactionHistoryCategory.TokenRevoke:
            return <Trans>Revoked</Trans>;
        case TransactionHistoryCategory.ContractInteraction:
            return <Trans>Interacted</Trans>;
        case TransactionHistoryCategory.TokenBridge:
            return <Trans>Bridged</Trans>;
        default:
            safeUnreachable(category);
            return null;
    }
}

export function TransactionDetailActionLabel({ category }: { category: TransactionHistoryCategory }) {
    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Trans>Received</Trans>;
        case TransactionHistoryCategory.TokenSend:
            return <Trans>Sent</Trans>;
        case TransactionHistoryCategory.TokenApprove:
            return <Trans>Approved</Trans>;
        case TransactionHistoryCategory.TokenRevoke:
            return <Trans>Revoked</Trans>;
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenBridge:
            return <Trans>Interacted</Trans>;
        default:
            safeUnreachable(category);
            return null;
    }
}

export function TransactionDetailPreposition({ category }: { category: TransactionHistoryCategory }) {
    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Trans>from</Trans>;
        case TransactionHistoryCategory.TokenSend:
            return <Trans>to</Trans>;
        case TransactionHistoryCategory.TokenApprove:
        case TransactionHistoryCategory.TokenRevoke:
            return <Trans>on</Trans>;
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenBridge:
            return <Trans>with</Trans>;
        default:
            safeUnreachable(category);
            return null;
    }
}

export function TransactionAssetRowLabel({ label }: { label: TransactionAssetLabel }) {
    switch (label) {
        case 'received':
            return <Trans>Received</Trans>;
        case 'sent':
            return <Trans>Sent</Trans>;
        case 'approved':
            return <Trans>Approved</Trans>;
        case 'revoked':
            return <Trans>Revoked</Trans>;
        default:
            safeUnreachable(label);
            return null;
    }
}

export function TransactionContractFallbackIcon() {
    return <ClipboardTextIcon className="size-3 text-secondary" />;
}

export function TransactionProjectLogo({ src, alt }: { src: string; alt?: string }) {
    return <Image src={src} width={20} height={20} alt={alt ?? ''} />;
}
