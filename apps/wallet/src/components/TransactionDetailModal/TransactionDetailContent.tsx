import ClipboardTextIcon from '@dimensiondev/assets/clipboard-text.svg';
import Receive from '@dimensiondev/assets/download1.svg';
import Interaction from '@dimensiondev/assets/interaction.svg';
import Revoke from '@dimensiondev/assets/revoke.svg';
import Send from '@dimensiondev/assets/send1.svg';
import Approve from '@dimensiondev/assets/tick-circle.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { safeUnreachable } from '@dimensiondev/utils';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Select, Trans } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { first } from 'lodash-es';
import { memo, type MouseEvent, useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useEnsName } from 'wagmi';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { AddressLink } from '@/components/TransactionDetailModal/AddressLink.js';
import { InlineTarget } from '@/components/TransactionDetailModal/InlineTarget.js';
import { TokenInfoRow } from '@/components/TransactionDetailModal/TokenInfoRow.js';
import { TransactionDate } from '@/components/TransactionDetailModal/TransactionDate.js';
import { TxLink } from '@/components/TransactionDetailModal/TxLink.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { getChainName } from '@/helpers/getChainName.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isUnlimit } from '@/helpers/isUnlimit.js';
import { cn } from '@/lib/utils.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    TransactionState,
} from '@/providers/types/Firefly.js';

export interface TransactionDetailContentProps {
    transaction: TransactionHistoryItem;
    onClose?: () => void;
}

const TransactionCategoryIcon = memo(function TransactionCategoryIcon({
    category,
}: {
    category: TransactionHistoryCategory;
}) {
    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Receive className="size-3" />;
        case TransactionHistoryCategory.TokenSend:
            return <Send className="size-3" />;
        case TransactionHistoryCategory.TokenApprove:
            return <Approve className="size-3" />;
        case TransactionHistoryCategory.ContractInteraction:
            return <Interaction className="size-3" />;
        case TransactionHistoryCategory.TokenRevoke:
            return <Revoke className="size-3" />;
        case TransactionHistoryCategory.TokenSwap:
            return <Interaction className="size-3" />;
        case TransactionHistoryCategory.NftReceive:
            return <Receive className="size-3" />;
        case TransactionHistoryCategory.NftSend:
            return <Send className="size-3" />;
        case TransactionHistoryCategory.NftMint:
            return <Interaction className="size-3" />;
        case TransactionHistoryCategory.TokenBridge:
            return <Interaction className="size-3" />;
        default:
            safeUnreachable(category);
            return <Interaction className="size-3" />;
    }
});

export const TransactionDetailContentCard = memo(function TransactionDetailContentCard({
    transaction,
    onNavigate,
}: {
    transaction: TransactionHistoryItem;
    onNavigate?: (href: string) => void;
}) {
    switch (transaction.category) {
        case TransactionHistoryCategory.TokenReceive: {
            const token = first(transaction.token_receives);
            if (!token) return null;
            return (
                <TokenInfoRow
                    chainId={transaction.chain_id}
                    label={<Trans>Received</Trans>}
                    tokenLogo={token?.token.logo ?? null}
                    tokenSymbol={token?.token.symbol ?? null}
                    tokenName={token?.token.name ?? null}
                    amountText={token?.amount ? renderShrankPrice(formatPrice(token.amount) ?? '') : null}
                    amountPrefix="+"
                    amountClassName="text-success"
                    amount={token?.amount}
                    price={token?.token.price}
                    onNavigate={onNavigate}
                />
            );
        }
        case TransactionHistoryCategory.TokenSend: {
            const token = first(transaction.token_sends);
            if (!token) return null;
            return (
                <TokenInfoRow
                    chainId={transaction.chain_id}
                    label={<Trans>Sent</Trans>}
                    tokenLogo={token?.token.logo ?? null}
                    tokenSymbol={token?.token.symbol ?? null}
                    tokenName={token?.token.name ?? null}
                    amountText={token?.amount ? renderShrankPrice(formatPrice(token.amount) ?? '') : null}
                    amountPrefix="-"
                    amountClassName="text-main"
                    amount={token?.amount}
                    price={token?.token.price}
                    onNavigate={onNavigate}
                />
            );
        }
        case TransactionHistoryCategory.TokenApprove: {
            const token = transaction.token_approve?.token;
            if (!token) return null;
            return (
                <TokenInfoRow
                    chainId={transaction.chain_id}
                    label={<Trans>Approved</Trans>}
                    tokenLogo={token?.logo ?? null}
                    tokenSymbol={token?.symbol ?? null}
                    tokenName={token?.name ?? null}
                    amountText={null}
                    amountPrefix=""
                    amountClassName="text-main"
                    price={token?.price}
                    address={token?.address}
                    onNavigate={onNavigate}
                />
            );
        }
        case TransactionHistoryCategory.TokenRevoke: {
            const token = transaction.token_approve?.token;
            if (!token) return null;
            return (
                <TokenInfoRow
                    chainId={transaction.chain_id}
                    label={<Trans>Revoked</Trans>}
                    tokenLogo={token?.logo ?? null}
                    tokenSymbol={token?.symbol ?? null}
                    tokenName={token?.name ?? null}
                    amountText={
                        transaction.token_approve?.amount ? (
                            isUnlimit(transaction.token_approve.amount) ? (
                                <Trans>Unlimit {transaction.token_approve.token.symbol}</Trans>
                            ) : (
                                renderShrankPrice(formatPrice(transaction.token_approve.amount) ?? '')
                            )
                        ) : null
                    }
                    amountPrefix=""
                    amountClassName="text-main"
                    price={token?.price}
                    address={token?.address}
                    onNavigate={onNavigate}
                />
            );
        }
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction:
        case TransactionHistoryCategory.TokenBridge: {
            const sentToken = first(transaction.token_sends);
            const receivedToken = first(transaction.token_receives);
            return (
                <div>
                    {sentToken ? (
                        <TokenInfoRow
                            chainId={transaction.chain_id}
                            label={<Trans>Sent</Trans>}
                            tokenLogo={sentToken?.token.logo ?? null}
                            tokenSymbol={sentToken?.token.symbol ?? null}
                            tokenName={sentToken?.token.name ?? null}
                            amountText={
                                sentToken?.amount ? renderShrankPrice(formatPrice(sentToken.amount) ?? '') : null
                            }
                            amountPrefix="-"
                            amountClassName="text-main"
                            amount={sentToken?.amount}
                            price={sentToken?.token.price}
                            address={sentToken?.token.address}
                            onNavigate={onNavigate}
                        />
                    ) : null}

                    {receivedToken ? (
                        <TokenInfoRow
                            chainId={transaction.chain_id}
                            label={<Trans>Received</Trans>}
                            tokenLogo={receivedToken?.token.logo ?? null}
                            tokenSymbol={receivedToken?.token.symbol ?? null}
                            tokenName={receivedToken?.token.name ?? null}
                            amountText={
                                receivedToken?.amount
                                    ? renderShrankPrice(formatPrice(receivedToken.amount) ?? '')
                                    : null
                            }
                            amountPrefix="+"
                            amountClassName="text-success"
                            showLabelMarginTop
                            amount={receivedToken?.amount}
                            price={receivedToken?.token.price}
                            address={receivedToken?.token.address}
                            onNavigate={onNavigate}
                        />
                    ) : null}
                </div>
            );
        }
        case TransactionHistoryCategory.NftReceive:
        case TransactionHistoryCategory.NftSend:
        case TransactionHistoryCategory.NftMint:
            return null;
        default:
            safeUnreachable(transaction.category);
            return null;
    }
});

export default memo(function TransactionDetailContent({ transaction, onClose }: TransactionDetailContentProps) {
    const token = first(transaction.token_receives) || first(transaction.token_sends);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: transaction.from_address });

    const isSolana = transaction.chain_id === SolanaChainId.Mainnet;
    const fromAddress = transaction.from_address || token?.sender;
    const toAddress = transaction.to_address || token?.recipient;

    const fromAddressName = fromAddress ? formatAddress(fromAddress, 4).toLowerCase() : undefined;
    const toAddressName = toAddress ? formatAddress(toAddress, 4).toLowerCase() : undefined;

    const { data: fromEnsHandle } = useEnsName({
        address: fromAddress as Address,
        chainId: mainnet.id,
        query: {
            enabled: !isSolana,
        },
    });
    const { data: toEnsHandle } = useEnsName({
        address: toAddress as Address,
        chainId: mainnet.id,
        query: {
            enabled: !isSolana,
        },
    });

    const href = getBlockExplorersURL(transaction.chain_id, transaction.hash, 'tx');

    const navigate = useNavigate();

    const navigateWithinApp = useCallback(
        (path: string) => {
            if (!path) return;
            const isEmbedded = typeof window !== 'undefined' && window.top && window.top !== window;
            if (isEmbedded) {
                void iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, { path });
                return;
            }
            navigate({ to: path });
        },
        [navigate],
    );

    const handleNavigateInternal = useCallback(
        (path: string) => {
            if (!path) return;
            onClose?.();
            navigateWithinApp(path);
        },
        [onClose, navigateWithinApp],
    );

    const handleInternalLinkClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>, path: string) => {
            if (
                !path ||
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }
            event.preventDefault();
            handleNavigateInternal(path);
        },
        [handleNavigateInternal],
    );

    const subtitle = useMemo(() => {
        if (!fromAddress || !toAddress) return null;

        switch (transaction.category) {
            case TransactionHistoryCategory.TokenReceive:
                return (
                    <Trans>
                        <div className="border-main text-main flex items-center rounded-lg border px-2 py-[2px]">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Received</span>
                        </div>
                        <span className="text-xs leading-[12px]">from</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: fromAddress })}
                            logo={
                                <Image
                                    src={getStampAvatarByProfileId(Source.Wallet, fromAddress)}
                                    width={20}
                                    height={20}
                                    alt={fromAddressName || ''}
                                    className="rounded-full"
                                />
                            }
                            text={fromEnsHandle ?? fromAddressName}
                            onNavigate={(href) => handleNavigateInternal(href)}
                        />
                    </Trans>
                );
            case TransactionHistoryCategory.TokenSend:
                return (
                    <Trans>
                        <div className="border-main text-main flex items-center rounded-lg border px-2 py-[2px]">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Sent</span>
                        </div>
                        <span className="text-xs leading-[12px]">to</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                            logo={
                                <Image
                                    src={getStampAvatarByProfileId(Source.Wallet, toAddress)}
                                    width={20}
                                    height={20}
                                    alt={toAddressName || ''}
                                    className="rounded-full"
                                />
                            }
                            text={toEnsHandle ?? toAddressName}
                            onNavigate={(href) => handleNavigateInternal(href)}
                        />
                    </Trans>
                );
            case TransactionHistoryCategory.TokenApprove:
                return (
                    <Trans>
                        <div className="border-main text-main flex items-center rounded-lg border px-2 py-[2px]">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Approved</span>
                        </div>
                        <span className="text-xs leading-[12px]">on</span>
                        <InlineTarget
                            href={getProfileUrl({
                                source: Source.Wallet,
                                profileId: transaction.token_approve?.spender_address ?? toAddress,
                            })}
                            logo={
                                transaction.project_logo ? (
                                    <Image
                                        src={transaction.project_logo}
                                        width={20}
                                        height={20}
                                        alt={transaction.project_name}
                                    />
                                ) : undefined
                            }
                            text={transaction.project_name ?? (toAddressName || '')}
                            onNavigate={(href) => handleNavigateInternal(href)}
                        />
                    </Trans>
                );

            case TransactionHistoryCategory.TokenRevoke:
                return (
                    <Trans>
                        <div className="border-main text-main flex items-center rounded-lg border px-2 py-[2px]">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Revoked</span>
                        </div>
                        <span className="text-xs leading-[12px]">on</span>
                        <InlineTarget
                            href={getProfileUrl({
                                source: Source.Wallet,
                                profileId: transaction.token_approve?.spender_address ?? toAddress,
                            })}
                            logo={
                                transaction.project_logo ? (
                                    <Image
                                        src={transaction.project_logo}
                                        width={20}
                                        height={20}
                                        alt={transaction.project_name}
                                    />
                                ) : undefined
                            }
                            text={transaction.token_approve?.spender_address ?? (toAddressName || '')}
                            onNavigate={(href) => handleNavigateInternal(href)}
                        />
                    </Trans>
                );
            case TransactionHistoryCategory.TokenSwap:
            case TransactionHistoryCategory.ContractInteraction:
            case TransactionHistoryCategory.NftReceive:
            case TransactionHistoryCategory.NftSend:
            case TransactionHistoryCategory.NftMint:
            case TransactionHistoryCategory.TokenBridge: {
                const logoSrc =
                    transaction.project_logo ||
                    first(transaction.token_sends)?.token.logo ||
                    first(transaction.token_receives)?.token.logo ||
                    transaction.token_approve?.token.logo;
                const logoNode = logoSrc ? (
                    <Image src={logoSrc} width={20} height={20} alt={transaction.project_name} />
                ) : (
                    <ClipboardTextIcon className="text-secondary size-3" />
                );
                return (
                    <Trans>
                        <div className="border-main text-main flex items-center rounded-lg border px-2 py-[2px]">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Interacted</span>
                        </div>
                        <span className="text-xs leading-[12px]">with</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                            logo={logoNode}
                            text={toAddressName || ''}
                            onNavigate={(href) => handleNavigateInternal(href)}
                        />
                    </Trans>
                );
            }
            default:
                safeUnreachable(transaction.category);
                return null;
        }
    }, [
        transaction,
        toEnsHandle,
        toAddress,
        fromAddress,
        fromEnsHandle,
        fromAddressName,
        toAddressName,
        handleNavigateInternal,
    ]);

    if (!fromAddress || !toAddress) return null;

    return (
        <div>
            <div className="flex items-center gap-3">
                <Link
                    to={profileUrl}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => handleInternalLinkClick(event, profileUrl)}
                >
                    <Image
                        width={40}
                        height={40}
                        src={getStampAvatarByProfileId(Source.Wallet, fromAddress)}
                        alt={fromAddressName || ''}
                        className="size-10 rounded-full"
                    />
                </Link>
                <div className="flex flex-col">
                    <div className="text-medium flex items-center gap-x-1">
                        <Link
                            to={profileUrl}
                            className="text-lightMain min-w-0 truncate text-base font-semibold"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
                                handleInternalLinkClick(event, profileUrl)
                            }
                        >
                            {fromEnsHandle ? <span>{fromEnsHandle}</span> : fromAddressName}
                        </Link>
                    </div>
                    <div className="text-second flex items-center gap-x-1 text-sm">
                        {fromEnsHandle ? (
                            <Link
                                to={profileUrl}
                                className="text-second"
                                onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
                                    handleInternalLinkClick(event, profileUrl)
                                }
                            >
                                {fromAddressName}
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-x-2">{subtitle}</div>
            <div className="mt-3">
                <TransactionDetailContentCard transaction={transaction} onNavigate={handleNavigateInternal} />
            </div>

            <div className="mt-5 space-y-3">
                {transaction.category === TransactionHistoryCategory.TokenSend ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-second text-sm">
                                <Trans>To Address</Trans>
                            </span>
                            <span className="flex items-center gap-1">
                                <Image
                                    src={getStampAvatarByProfileId(Source.Wallet, toAddress)}
                                    width={20}
                                    height={20}
                                    alt={toAddressName || ''}
                                    className="rounded-full"
                                />
                                <AddressLink chainId={transaction.chain_id} address={toAddress} />
                            </span>
                        </div>
                    </div>
                ) : null}
                {transaction.category === TransactionHistoryCategory.TokenReceive ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-second text-sm">
                                <Trans>From Address</Trans>
                            </span>
                            <span className="flex gap-1">
                                <AddressLink chainId={transaction.chain_id} address={fromAddress} />
                            </span>
                        </div>
                    </div>
                ) : null}
                {transaction.category === TransactionHistoryCategory.TokenApprove ||
                transaction.category === TransactionHistoryCategory.TokenRevoke ||
                transaction.category === TransactionHistoryCategory.ContractInteraction ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-second text-sm">
                                <Trans>Contract</Trans>
                            </span>
                            <span className="flex gap-1">
                                {transaction.project_logo ? (
                                    <Image
                                        src={transaction.project_logo}
                                        alt={transaction.project_name}
                                        width={20}
                                        height={20}
                                    />
                                ) : null}
                                <AddressLink chainId={transaction.chain_id} address={toAddress} />
                            </span>
                        </div>
                    </div>
                ) : null}
                <div className="flex items-center justify-between">
                    <span className="text-second text-sm">
                        <Trans>Transaction Hash</Trans>
                    </span>
                    {transaction.hash ? <TxLink chainId={transaction.chain_id} hash={transaction.hash} /> : '--'}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-second text-sm">
                        <Trans>Block</Trans>
                    </span>
                    <span className="text-main text-sm font-medium">{transaction.block_number}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-second text-sm">
                        <Trans>Status</Trans>
                    </span>
                    <span
                        className={cn('flex items-center gap-2 text-sm font-medium', {
                            'text-success': transaction.tx_status === TransactionState.Success,

                            'text-danger': transaction.tx_status === TransactionState.Failed,
                        })}
                    >
                        <div
                            className={cn('size-1 rounded-full', {
                                'bg-success': transaction.tx_status === TransactionState.Success,

                                'bg-danger': transaction.tx_status === TransactionState.Failed,
                            })}
                        />
                        <Select value={transaction.tx_status} _success="Success" _fail="Failed" other="Failed" />
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-second text-sm">
                        <Trans>Network</Trans>
                    </span>
                    <div className="flex items-center gap-1">
                        <ChainIcon
                            chainId={transaction.chain_id}
                            size={20}
                            networkType={transaction.chain_id === 101 ? NetworkType.Solana : NetworkType.Ethereum}
                        />
                        <span className="text-lightMain text-sm font-medium">
                            {transaction.chain_id === 101 ? 'Solana' : getChainName(transaction.chain_id)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-second text-sm">
                        <Trans>Time</Trans>
                    </span>
                    <span className="text-main text-sm font-medium">
                        {transaction.timestamp ? <TransactionDate time={Number(transaction.timestamp) * 1000} /> : '--'}
                    </span>
                </div>
            </div>

            <div className="mt-6 md:mt-6">
                <ClickableButton
                    className="bg-lightMain text-primaryBottom fixed bottom-6 left-1/2 z-20 flex h-12 w-[calc(100%-32px)] -translate-x-1/2 items-center justify-center rounded-xl text-sm font-bold shadow-lg md:static md:h-10 md:w-full md:translate-x-0 md:rounded-lg md:shadow-none"
                    onClick={() => {
                        window.open(href, '_blank');
                    }}
                >
                    <Trans>View on Explorer</Trans>
                </ClickableButton>
                <div className="h-20 md:hidden" />
            </div>
        </div>
    );
});
