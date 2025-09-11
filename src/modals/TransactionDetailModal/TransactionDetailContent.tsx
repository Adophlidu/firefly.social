import { Select, Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';

import { TransactionDate } from '@/app/(normal)/tx/[chain_id]/[hash]/components/TransactionDate.js';
import { AddressLink, TxLink } from '@/app/(normal)/tx/[chain_id]/[hash]/components/TxLink.js';
import ClipboardTextIcon from '@/assets/clipboard-text.svg';
import Receive from '@/assets/download1.svg';
import Interaction from '@/assets/interaction.svg';
import Revoke from '@/assets/revoke.svg';
import Send from '@/assets/send1.svg';
import Approve from '@/assets/tick-circle.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { isUnlimit } from '@/components/TransactionHistory/list.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { getChainName } from '@/helpers/getChainName.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useEnsNameCached } from '@/hooks/useEnsNameCached.js';
import { InlineTarget } from '@/modals/TransactionDetailModal/InlineTarget.js';
import { TokenInfoRow } from '@/modals/TransactionDetailModal/TokenInfoRow.js';
import { TransactionDetailModalRef } from '@/modals/TransactionDetailModal/TransactionDetailModal.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    TransactionState,
} from '@/providers/types/Firefly.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export interface TransactionDetailContentProps {
    transaction: TransactionHistoryItem;
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
        default:
            return <Interaction className="size-3" />;
    }
});

export const TransactionDetailContentCard = memo(function TransactionDetailContentCard({
    transaction,
}: {
    transaction: TransactionHistoryItem;
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
                />
            );
        }
        case TransactionHistoryCategory.TokenSwap:
        case TransactionHistoryCategory.ContractInteraction: {
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
                        />
                    ) : null}
                </div>
            );
        }
        default:
            return null;
    }
});

export default memo(function TransactionDetailContent({ transaction }: TransactionDetailContentProps) {
    const token = first(transaction.token_receives) || first(transaction.token_sends);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: transaction.from_address });

    const isSolana = transaction.chain_id === SolanaChainId.Mainnet;
    const fromAddress = token?.sender || transaction.from_address;
    const toAddress = token?.recipient || transaction.to_address;

    const fromAddressName = fromAddress ? formatAddress(fromAddress, 4).toLowerCase() : undefined;
    const toAddressName = toAddress ? formatAddress(toAddress, 4).toLowerCase() : undefined;

    const { data: fromEnsHandle } = useEnsNameCached(fromAddress, undefined, !isSolana);
    const { data: toEnsHandle } = useEnsNameCached(toAddress, undefined, !isSolana);

    const href = (transaction.chain_id === SolanaChainId.Mainnet ? SolanaNetwork : EthereumNetwork).getTransactionUrl(
        transaction.chain_id as never,
        transaction.hash as `0x${string}`,
    );

    const closeModal = useCallback(() => {
        TransactionDetailModalRef.close();
    }, []);

    const subtitle = useMemo(() => {
        if (!fromAddress || !toAddress) return null;
        switch (transaction.category) {
            case TransactionHistoryCategory.TokenReceive:
                return (
                    <Trans>
                        <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Received</span>
                        </div>
                        <span className="text-xs leading-[12px]">from</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: fromAddress })}
                            logo={
                                <Avatar
                                    src={getStampAvatarByProfileId(Source.Wallet, fromAddress)}
                                    size={20}
                                    alt={fromAddressName || ''}
                                />
                            }
                            text={fromEnsHandle ?? fromAddressName}
                            onClick={closeModal}
                        />
                    </Trans>
                );
            case TransactionHistoryCategory.TokenSend:
                return (
                    <Trans>
                        <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Sent</span>
                        </div>
                        <span className="text-xs leading-[12px]">to</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                            logo={
                                <Avatar
                                    src={getStampAvatarByProfileId(Source.Wallet, toAddress)}
                                    size={20}
                                    alt={toAddressName || ''}
                                />
                            }
                            text={toEnsHandle ?? toAddressName}
                            onClick={closeModal}
                        />
                    </Trans>
                );
            case TransactionHistoryCategory.TokenApprove:
                return (
                    <Trans>
                        <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
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
                                    <Avatar src={transaction.project_logo} size={20} alt={transaction.project_name} />
                                ) : undefined
                            }
                            text={transaction.project_name ?? (toAddressName || '')}
                            onClick={closeModal}
                        />
                    </Trans>
                );

            case TransactionHistoryCategory.TokenRevoke:
                return (
                    <Trans>
                        <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
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
                                    <Avatar src={transaction.project_logo} size={20} alt={transaction.project_name} />
                                ) : undefined
                            }
                            text={transaction.token_approve?.spender_address ?? (toAddressName || '')}
                            onClick={closeModal}
                        />
                    </Trans>
                );
            default:
                return (
                    <Trans>
                        <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
                            <TransactionCategoryIcon category={transaction.category} />
                            <span className="text-sm">Interacted</span>
                        </div>
                        <span className="text-xs leading-[12px]">with</span>
                        <InlineTarget
                            href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                            logo={<ClipboardTextIcon className="size-3 text-secondary" />}
                            text={toAddressName || ''}
                            onClick={closeModal}
                        />
                    </Trans>
                );
        }
    }, [transaction, toEnsHandle, toAddress, fromAddress, fromEnsHandle, fromAddressName, toAddressName, closeModal]);

    if (!fromAddress || !toAddress) return null;

    return (
        <div>
            <div className="flex items-center gap-3">
                <Link href={profileUrl} onClick={closeModal}>
                    <Avatar
                        size={40}
                        src={getStampAvatarByProfileId(Source.Wallet, fromAddress)}
                        alt={fromAddressName || ''}
                        className="size-10 rounded-full"
                    />
                </Link>
                <div className="flex flex-col">
                    <div className="flex items-center gap-x-1 text-medium">
                        <Link
                            href={profileUrl}
                            className="min-w-0 truncate text-base font-semibold text-lightMain"
                            onClick={closeModal}
                        >
                            {fromEnsHandle ? <span>{fromEnsHandle}</span> : fromAddressName}
                        </Link>
                    </div>
                    <div className="flex items-center gap-x-1 text-sm text-second">
                        {fromEnsHandle ? (
                            <Link href={profileUrl} className="text-second" onClick={closeModal}>
                                {fromAddressName}
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-x-2">{subtitle}</div>
            <div className="mt-3">
                <TransactionDetailContentCard transaction={transaction} />
            </div>

            <div className="mt-5 space-y-3">
                {transaction.category === TransactionHistoryCategory.TokenSend ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
                                <Trans>To Address</Trans>
                            </span>
                            <span className="flex items-center gap-1">
                                <Avatar
                                    src={getStampAvatarByProfileId(Source.Wallet, toAddress)}
                                    size={20}
                                    alt={toAddressName || ''}
                                />
                                <AddressLink chainId={transaction.chain_id} address={toAddress} />
                            </span>
                        </div>
                    </div>
                ) : null}
                {transaction.category === TransactionHistoryCategory.TokenReceive ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-second">
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
                            <span className="text-sm text-second">
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
                    <span className="text-sm text-second">
                        <Trans>Transaction Hash</Trans>
                    </span>
                    {transaction.hash ? <TxLink chainId={transaction.chain_id} hash={transaction.hash} /> : '--'}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-second">
                        <Trans>Block</Trans>
                    </span>
                    <span className="text-sm font-medium text-main">{transaction.block_number}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-second">
                        <Trans>Status</Trans>
                    </span>
                    <span
                        className={classNames('flex items-center gap-2 text-sm font-medium', {
                            'text-success': transaction.tx_status === TransactionState.Success,

                            'text-danger': transaction.tx_status === TransactionState.Failed,
                        })}
                    >
                        <div
                            className={classNames('h-1 w-1 rounded-full', {
                                'bg-success': transaction.tx_status === TransactionState.Success,

                                'bg-danger': transaction.tx_status === TransactionState.Failed,
                            })}
                        />
                        <Select value={transaction.tx_status} _success="Success" _fail="Failed" other="Failed" />
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-second">
                        <Trans>Network</Trans>
                    </span>
                    <div className="flex items-center gap-1">
                        <ChainIcon
                            chainId={transaction.chain_id}
                            size={20}
                            networkType={transaction.chain_id === 101 ? NetworkType.Solana : NetworkType.Ethereum}
                        />
                        <span className="text-sm font-medium text-lightMain">
                            {transaction.chain_id === 101 ? 'Solana' : getChainName(transaction.chain_id)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-second">
                        <Trans>Time</Trans>
                    </span>
                    <span className="text-sm font-medium text-main">
                        {transaction.timestamp ? <TransactionDate time={Number(transaction.timestamp) * 1000} /> : '--'}
                    </span>
                </div>
            </div>

            <ClickableButton
                className="mt-6 flex h-10 w-full items-center justify-center rounded-lg bg-lightMain text-sm font-bold text-primaryBottom"
                onClick={() => {
                    openWindow(href, '_blank');
                }}
            >
                <Trans>View on Explorer</Trans>
            </ClickableButton>
        </div>
    );
});
