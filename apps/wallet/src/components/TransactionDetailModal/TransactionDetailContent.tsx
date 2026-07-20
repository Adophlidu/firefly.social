import { Source } from '@dimensiondev/enums';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { getChainName } from '@dimensiondev/web3/chains';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Select, Trans } from '@lingui/react/macro';
import { Link, useNavigate } from '@dimensiondev/ssr';
import { memo, type MouseEvent, type ReactNode, useCallback, useMemo } from 'react';
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
import {
    buildTransactionPresentation,
    TransactionAssetRowLabel,
    TransactionCategoryIcon,
    TransactionContractFallbackIcon,
    TransactionDetailActionLabel,
    TransactionDetailPreposition,
    type TransactionPresentation,
    TransactionProjectLogo,
} from '@/components/TransactionPresentation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
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

export const TransactionDetailContentCard = memo(function TransactionDetailContentCard({
    presentation,
    onNavigate,
}: {
    presentation: TransactionPresentation;
    onNavigate?: (href: string) => void;
}) {
    if (!presentation.assetRows.length) return null;

    return (
        <div>
            {presentation.assetRows.map((row) => (
                <TokenInfoRow
                    key={row.id}
                    chainId={row.chainId}
                    label={<TransactionAssetRowLabel label={row.label} />}
                    tokenLogo={row.tokenLogo}
                    tokenSymbol={row.tokenSymbol}
                    tokenName={row.tokenName}
                    amountText={row.amountText}
                    amountPrefix={row.amountPrefix}
                    amountClassName={row.amountClassName}
                    showLabelMarginTop={row.showLabelMarginTop}
                    amount={row.amount}
                    price={row.price}
                    address={row.address}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
});

function WalletAvatar({ address, className, size = 40 }: { address?: string; className?: string; size?: number }) {
    if (!address) {
        return (
            <span
                className={cn('inline-block rounded-full bg-bg', className)}
                style={{
                    width: size,
                    height: size,
                }}
            />
        );
    }

    return (
        <Image
            width={size}
            height={size}
            src={getStampAvatarByProfileId(Source.Wallet, address)}
            alt={formatAddress(address, 4).toLowerCase()}
            className={cn('rounded-full', className)}
        />
    );
}

function DetailAddressValue({
    chainId,
    address,
    avatarAddress,
    logo,
}: {
    chainId: number;
    address?: string;
    avatarAddress?: string;
    logo?: ReactNode;
}) {
    return (
        <span className="flex items-center gap-1">
            {avatarAddress ? <WalletAvatar address={avatarAddress} className="size-5" size={20} /> : logo}
            {address ? (
                <AddressLink chainId={chainId} address={address} />
            ) : (
                <span className="text-sm font-medium text-main">--</span>
            )}
        </span>
    );
}

function TransactionDetailSubtitle({
    transaction,
    presentation,
    fromEnsHandle,
    toEnsHandle,
    fromAddressName,
    toAddressName,
    onNavigate,
}: {
    transaction: TransactionHistoryItem;
    presentation: TransactionPresentation;
    fromEnsHandle?: string | null;
    toEnsHandle?: string | null;
    fromAddressName?: string;
    toAddressName?: string;
    onNavigate: (href?: string) => void;
}) {
    const target = presentation.subtitleTarget;
    if (!target) return null;

    let href: string | undefined;
    let logo: ReactNode;
    let text: ReactNode = '--';

    if (target.type === 'from-wallet') {
        href = target.address ? getProfileUrl({ source: Source.Wallet, profileId: target.address }) : undefined;
        logo = target.address ? <WalletAvatar address={target.address} className="size-5" size={20} /> : undefined;
        text = fromEnsHandle ?? fromAddressName ?? '--';
    } else if (target.type === 'to-wallet') {
        href = target.address ? getProfileUrl({ source: Source.Wallet, profileId: target.address }) : undefined;
        logo = target.address ? <WalletAvatar address={target.address} className="size-5" size={20} /> : undefined;
        text = toEnsHandle ?? toAddressName ?? '--';
    } else if (target.type === 'project') {
        href = target.address ? getProfileUrl({ source: Source.Wallet, profileId: target.address }) : undefined;
        logo = target.logo ? <TransactionProjectLogo src={target.logo} alt={target.name} /> : undefined;
        text =
            target.name ?? target.rawText ?? (target.address ? formatAddress(target.address, 4).toLowerCase() : '--');
    } else {
        href = target.address ? getProfileUrl({ source: Source.Wallet, profileId: target.address }) : undefined;
        logo = target.logo ? (
            <TransactionProjectLogo src={target.logo} alt={transaction.project_name} />
        ) : (
            <TransactionContractFallbackIcon />
        );
        text = target.address ? formatAddress(target.address, 4).toLowerCase() : '--';
    }

    const targetNode = href ? (
        <InlineTarget href={href} logo={logo} text={text} onNavigate={onNavigate} />
    ) : (
        <span className="flex items-center gap-x-1">
            {logo}
            <span className="text-sm font-semibold leading-[18px]">{text}</span>
        </span>
    );

    return (
        <>
            <div className="flex items-center rounded-lg border border-main px-2 py-[2px] text-main">
                <TransactionCategoryIcon category={transaction.category} />
                <span className="text-sm">
                    <TransactionDetailActionLabel category={transaction.category} />
                </span>
            </div>
            <span className="text-xs leading-[12px]">
                <TransactionDetailPreposition category={transaction.category} />
            </span>
            {targetNode}
        </>
    );
}

export default memo(function TransactionDetailContent({ transaction, onClose }: TransactionDetailContentProps) {
    const presentation = useMemo(() => buildTransactionPresentation(transaction), [transaction]);
    const { fromAddress, toAddress } = presentation;
    const profileAddress = presentation.profileAddress;
    const profileUrl = profileAddress ? getProfileUrl({ source: Source.Wallet, profileId: profileAddress }) : undefined;

    const fromAddressName = fromAddress ? formatAddress(fromAddress, 4).toLowerCase() : undefined;
    const toAddressName = toAddress ? formatAddress(toAddress, 4).toLowerCase() : undefined;

    const { data: fromEnsHandle } = useEnsName({
        address: fromAddress as Address,
        chainId: mainnet.id,
        query: {
            enabled: !presentation.isSolana && !!fromAddress,
        },
    });
    const { data: toEnsHandle } = useEnsName({
        address: toAddress as Address,
        chainId: mainnet.id,
        query: {
            enabled: !presentation.isSolana && !!toAddress,
        },
    });

    const navigate = useNavigate();

    const navigateWithinApp = useCallback(
        (path?: string) => {
            if (!path) return;
            const isEmbedded = typeof window !== 'undefined' && window.top && window.top !== window;
            if (isEmbedded) {
                void iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, { path });
                return;
            }
            navigate(path);
        },
        [navigate],
    );

    const handleNavigateInternal = useCallback(
        (path?: string) => {
            if (!path) return;
            onClose?.();
            navigateWithinApp(path);
        },
        [onClose, navigateWithinApp],
    );

    const handleInternalLinkClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>, path?: string) => {
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

    const showContractRow =
        transaction.category === TransactionHistoryCategory.TokenApprove ||
        transaction.category === TransactionHistoryCategory.TokenRevoke ||
        transaction.category === TransactionHistoryCategory.ContractInteraction;

    const networkName = presentation.isSolana ? 'Solana' : getChainName(transaction.chain_id);

    return (
        <div>
            <div className="flex items-center gap-3">
                {profileUrl ? (
                    <Link
                        href={profileUrl}
                        onClick={(event: MouseEvent<HTMLAnchorElement>) => handleInternalLinkClick(event, profileUrl)}
                    >
                        <WalletAvatar address={profileAddress} className="size-10" />
                    </Link>
                ) : (
                    <WalletAvatar address={profileAddress} className="size-10" />
                )}
                <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-x-1 text-medium">
                        {profileUrl ? (
                            <Link
                                href={profileUrl}
                                className="min-w-0 truncate text-base font-semibold text-lightMain"
                                onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                    handleInternalLinkClick(event, profileUrl)
                                }
                            >
                                {fromEnsHandle ? <span>{fromEnsHandle}</span> : (fromAddressName ?? '--')}
                            </Link>
                        ) : (
                            <span className="min-w-0 truncate text-base font-semibold text-lightMain">
                                {fromEnsHandle ? <span>{fromEnsHandle}</span> : (fromAddressName ?? '--')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-x-1 text-sm text-second">
                        {fromEnsHandle && profileUrl ? (
                            <Link
                                href={profileUrl}
                                className="text-second"
                                onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                    handleInternalLinkClick(event, profileUrl)
                                }
                            >
                                {fromAddressName}
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-x-2">
                <TransactionDetailSubtitle
                    transaction={transaction}
                    presentation={presentation}
                    fromEnsHandle={fromEnsHandle}
                    toEnsHandle={toEnsHandle}
                    fromAddressName={fromAddressName}
                    toAddressName={toAddressName}
                    onNavigate={handleNavigateInternal}
                />
            </div>
            <div className="mt-3">
                <TransactionDetailContentCard presentation={presentation} onNavigate={handleNavigateInternal} />
            </div>

            <div className="mt-5 space-y-3">
                {transaction.category === TransactionHistoryCategory.TokenSend ? (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-second">
                            <Trans>To Address</Trans>
                        </span>
                        <DetailAddressValue
                            chainId={transaction.chain_id}
                            address={toAddress}
                            avatarAddress={toAddress}
                        />
                    </div>
                ) : null}
                {transaction.category === TransactionHistoryCategory.TokenReceive ? (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-second">
                            <Trans>From Address</Trans>
                        </span>
                        <DetailAddressValue chainId={transaction.chain_id} address={fromAddress} />
                    </div>
                ) : null}
                {showContractRow ? (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-second">
                            <Trans>Contract</Trans>
                        </span>
                        <DetailAddressValue
                            chainId={transaction.chain_id}
                            address={presentation.contractAddress}
                            logo={
                                transaction.project_logo ? (
                                    <Image
                                        src={transaction.project_logo}
                                        alt={transaction.project_name}
                                        width={20}
                                        height={20}
                                    />
                                ) : undefined
                            }
                        />
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
                    <span className="text-sm font-medium text-main">{transaction.block_number || '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-second">
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
                    <span className="text-sm text-second">
                        <Trans>Network</Trans>
                    </span>
                    <div className="flex items-center gap-1">
                        <ChainIcon chainId={transaction.chain_id} size={20} networkType={presentation.networkType} />
                        <span className="text-sm font-medium text-lightMain">{networkName}</span>
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

            <div className="mt-6 md:mt-6">
                <ClickableButton
                    disabled={!presentation.explorerUrl}
                    className="fixed bottom-6 left-1/2 z-20 flex h-12 w-[calc(100%-32px)] -translate-x-1/2 items-center justify-center rounded-xl bg-lightMain text-sm font-bold text-primaryBottom shadow-lg md:static md:h-10 md:w-full md:translate-x-0 md:rounded-lg md:shadow-none"
                    onClick={() => {
                        if (presentation.explorerUrl) window.open(presentation.explorerUrl, '_blank');
                    }}
                >
                    <Trans>View on Explorer</Trans>
                </ClickableButton>
                <div className="h-20 md:hidden" />
            </div>
        </div>
    );
});
