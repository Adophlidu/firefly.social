import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileTextIcon } from 'lucide-react';
import { Fragment } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ListInPage } from '@/components/ListInPage.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { formatDate } from '@/helpers/formatDate.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { useLocale } from '@/helpers/getCookies.js';
import { isGreaterThanOrEqualTo, toFixed } from '@/helpers/number.js';
import { groupAndSortByDate } from '@/helpers/sortAndGroupByDate.js';
import { cn } from '@/lib/utils.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    TransactionState,
} from '@/providers/types/Firefly.js';
import { getTransactionHistory } from '@/queries/firefly/getTransactionHistory.js';

const MaxUint128 = toFixed('0xffffffffffffffffffffffffffffffff');

interface Props {
    chains: number[];
    address?: string;
    onSelectTransaction?: (item: TransactionHistoryItem) => void;
}

export function TransactionHistory({ chains, address, onSelectTransaction }: Props) {
    const locale = useLocale();
    const queryResult = useSuspenseInfiniteQuery({
        ...getTransactionHistory(chains, address),
        select(data) {
            const items = data.pages.flatMap((x) => x.list);
            return groupAndSortByDate(items, (x) => formatDate(dayjs.unix(Number(x.timestamp)), 'date', locale));
        },
    });

    return (
        <ListInPage
            queryResult={queryResult}
            VirtualListProps={{
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: (index, item) => getTransactionHistoryItem(index, item, onSelectTransaction),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20 !pt-14',
            }}
        />
    );
}

export default TransactionHistory;

function getTransactionHistoryItem(
    index: number,
    item: TransactionHistoryItem & {
        date?: string;
    },
    onSelectTransaction?: (item: TransactionHistoryItem) => void,
) {
    return (
        <Fragment key={index}>
            {item.date ? <div className="text-second pt-4 text-sm font-medium">{item.date}</div> : null}
            <TransactionHistoryItem item={item} onSelectTransaction={onSelectTransaction} />
        </Fragment>
    );
}

function TransactionHistoryItem({
    item,
    onSelectTransaction,
}: {
    item: TransactionHistoryItem;
    onSelectTransaction?: (item: TransactionHistoryItem) => void;
}) {
    const content = (
        <>
            <div className="flex items-center space-x-5">
                <TransactionHistoryTokenItem item={item} />
                <div>
                    <div
                        className={cn('text-sm font-medium', {
                            'text-fail': item.tx_status === TransactionState.Failed,
                        })}
                    >
                        <Category category={item.category} state={item.tx_status} />
                    </div>
                    <TransactionHistorySubTitle item={item} />
                </div>
            </div>
            <ItemEnd item={item} />
        </>
    );

    return (
        <div
            className="hover:bg-bg my-1 flex items-center rounded-lg p-2"
            onClick={() => {
                if (onSelectTransaction) {
                    onSelectTransaction(item);
                    return;
                }
                const link = getBlockExplorersURL(item.chain_id, item.hash, 'tx');
                window.open(link, '_blank');
            }}
        >
            {content}
        </div>
    );
}

function Category({ category, state }: { category: TransactionHistoryCategory; state: TransactionState }) {
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
            case TransactionHistoryCategory.NftReceive:
                return <Trans>NFT Received Failed</Trans>;
            case TransactionHistoryCategory.NftSend:
                return <Trans>NFT Sent Failed</Trans>;
            case TransactionHistoryCategory.NftMint:
                return <Trans>NFT Minted Failed</Trans>;
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
        case TransactionHistoryCategory.NftReceive:
            return <Trans>NFT Received</Trans>;
        case TransactionHistoryCategory.NftSend:
            return <Trans>NFT Sent</Trans>;
        case TransactionHistoryCategory.NftMint:
            return <Trans>NFT Minted</Trans>;
        case TransactionHistoryCategory.ContractInteraction:
            return <Trans>Interacted</Trans>;
        case TransactionHistoryCategory.TokenBridge:
            return <Trans>Bridged</Trans>;
        default:
            safeUnreachable(category);
            return null;
    }
}

function ItemEnd({ item }: { item: TransactionHistoryItem }) {
    if (
        item.category === TransactionHistoryCategory.TokenSwap ||
        item.category === TransactionHistoryCategory.ContractInteraction ||
        item.category === TransactionHistoryCategory.TokenBridge
    ) {
        return (
            <div className="ml-auto min-w-0 text-right text-sm font-medium">
                {item.token_receives[0] ? (
                    <div className="text-success truncate">
                        +{renderShrankPrice(formatPrice(item.token_receives[0].amount) ?? '-')}{' '}
                        {item.token_receives[0].token.symbol}
                    </div>
                ) : null}
                {item.token_sends[0] ? (
                    <div
                        className={cn('truncate font-normal', {
                            'text-xs': !!item.token_receives[0],
                        })}
                    >
                        -{renderShrankPrice(formatPrice(item.token_sends[0].amount) ?? '-')}{' '}
                        {item.token_sends[0].token.symbol}
                    </div>
                ) : null}
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenRevoke) {
        if (!item.token_approve) return null;
        return <div className="ml-auto truncate text-right text-sm font-medium">{item.token_approve.token.symbol}</div>;
    }
    if (item.category === TransactionHistoryCategory.TokenApprove) {
        if (!item.token_approve) return null;
        const { amount, token } = item.token_approve;
        const isUnlimited = isGreaterThanOrEqualTo(amount, MaxUint128);
        return (
            <div
                className="ml-auto truncate text-right text-sm font-medium"
                title={`${formatPrice(amount) ?? ''} ${token.symbol}`}
            >
                {isUnlimited ? <Trans>Unlimited</Trans> : renderShrankPrice(formatPrice(amount) ?? '-')} {token.symbol}
            </div>
        );
    }
    const token = item.token_receives[0] || item.token_sends[0];
    if (!token) return null;
    if (item.category === TransactionHistoryCategory.TokenReceive) {
        return (
            <div className="text-success ml-auto truncate text-right text-sm font-medium">
                +{renderShrankPrice(formatPrice(token.amount) ?? '-')} {token.token.symbol}
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenSend) {
        return (
            <div className="ml-auto truncate text-right text-sm font-medium">
                -{renderShrankPrice(formatPrice(token.amount) ?? '-')} {token.token.symbol}
            </div>
        );
    }
    if (
        [
            TransactionHistoryCategory.NftReceive,
            TransactionHistoryCategory.NftSend,
            TransactionHistoryCategory.NftMint,
        ].includes(item.category)
    ) {
        const nft = item.nft_receives[0] || item.nft_sends[0];
        if (!nft) return null;
        const link = getBlockExplorersURL(item.chain_id, nft.nft.address, 'address');
        if (!link) return null;
        return (
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto truncate text-right text-sm font-medium hover:underline"
            >
                {nft.nft.symbol || <LinkIcon width={16} height={16} className="text-second shrink-0" />}
            </a>
        );
    }
    return (
        <div className="ml-auto truncate text-right text-sm font-medium">
            {renderShrankPrice(formatPrice(token.amount) ?? '-')} {token.token.symbol}
        </div>
    );
}

function TransactionHistoryTokenItem({ item }: { item: TransactionHistoryItem }) {
    const isSolana = item.chain_id === SolanaChainId.Mainnet;
    const networkType = isSolana ? NetworkType.Solana : NetworkType.Ethereum;
    const chainId = item.chain_id;
    if (
        [
            TransactionHistoryCategory.NftReceive,
            TransactionHistoryCategory.NftSend,
            TransactionHistoryCategory.NftMint,
        ].includes(item.category)
    ) {
        const nft = item.nft_receives[0] || item.nft_sends[0];
        return <TokenIcon icon={nft.nft.logo} networkType={networkType} chainId={chainId} />;
    }
    if (item.category === TransactionHistoryCategory.TokenApprove) {
        const token = item.token_approve?.token;
        if (!token) return null;
        return (
            <TokenIcon
                icon={token.logo}
                networkType={networkType}
                chainId={chainId}
                disableBadge={isSolana}
                symbol={token.symbol}
                name={token.name}
            />
        );
    }
    if (
        [
            TransactionHistoryCategory.TokenSwap,
            TransactionHistoryCategory.ContractInteraction,
            TransactionHistoryCategory.TokenBridge,
        ].includes(item.category) &&
        item.token_receives[0] &&
        item.token_sends[0]
    ) {
        const tokenReceive = item.token_receives[0];
        const tokenSend = item.token_sends[0];
        return (
            <div className="relative size-8">
                <TokenIcon
                    icon={tokenSend.token.logo}
                    networkType={networkType}
                    chainId={chainId}
                    className="!absolute left-0 top-0 rounded-full bg-white"
                    size={24}
                    disableBadge
                    symbol={tokenSend.token.symbol}
                    name={tokenSend.token.name}
                />
                <TokenIcon
                    icon={tokenReceive.token.logo}
                    networkType={networkType}
                    chainId={chainId}
                    size={24}
                    className="!absolute left-2.5 top-2 rounded-full bg-white"
                    disableBadge
                    symbol={tokenReceive.token.symbol}
                    name={tokenReceive.token.name}
                />
                <div className="z-1 absolute -right-2 bottom-0 w-[14px] rounded-full bg-white p-px">
                    <ChainIcon size={12} networkType={networkType} chainId={chainId} />
                </div>
            </div>
        );
    }

    if (item.category === TransactionHistoryCategory.TokenBridge) {
        const relatedToken = item.token_receives[0] || item.token_sends[0];
        const icon = item.project_logo || relatedToken?.token.logo || undefined;
        const symbol = relatedToken?.token.symbol;
        const name = item.project_name || relatedToken?.token.name;
        return (
            <TokenIcon
                icon={icon}
                symbol={symbol}
                name={name}
                networkType={networkType}
                chainId={chainId}
                disableBadge={isSolana}
            />
        );
    }

    if (item.category === TransactionHistoryCategory.ContractInteraction) {
        // Contract interactions may not include token sends/receives; prefer project logo,
        // then fall back to related token/nft logo (especially useful for failed transactions).
        const relatedToken = item.token_receives[0] || item.token_sends[0];
        const relatedNft = item.nft_receives[0] || item.nft_sends[0];
        const icon =
            item.project_logo ||
            relatedToken?.token.logo ||
            item.token_approve?.token.logo ||
            relatedNft?.nft.logo ||
            undefined;
        const symbol = relatedToken?.token.symbol || item.token_approve?.token.symbol || relatedNft?.nft.symbol;
        const name =
            item.project_name || relatedToken?.token.name || item.token_approve?.token.name || relatedNft?.nft.name;
        // When no icon, symbol, or name is available, show a document icon as fallback
        if (!icon && !symbol && !name) {
            return (
                <span className="relative" style={{ width: 30, height: 30 }}>
                    <span className="bg-main text-primaryBottom flex size-[30px] items-center justify-center rounded-full">
                        <FileTextIcon size={16} />
                    </span>
                    {!isSolana && chainId ? (
                        <span className="absolute -bottom-px right-[-6px] overflow-hidden rounded-full bg-white p-px">
                            <ChainIcon size={12} networkType={networkType} chainId={chainId} />
                        </span>
                    ) : null}
                </span>
            );
        }
        return (
            <TokenIcon
                icon={icon}
                symbol={symbol}
                name={name}
                networkType={networkType}
                chainId={chainId}
                disableBadge={isSolana}
            />
        );
    }

    const token = item.token_receives[0] || item.token_sends[0];
    return (
        <TokenIcon
            icon={token?.token?.logo}
            networkType={networkType}
            chainId={chainId}
            symbol={token?.token?.symbol}
            name={token?.token?.name}
        />
    );
}

function TransactionHistorySubTitle({ item }: { item: TransactionHistoryItem }) {
    const isSolana = item.chain_id === SolanaChainId.Mainnet;

    if (item.category === TransactionHistoryCategory.TokenApprove) {
        const address = isSolana ? item.to_address : item.token_approve?.spender_address || item.to_address;
        return (
            <div className="text-second text-[13px] font-medium lowercase leading-[18px]">
                <div>{formatAddress(address, 4)}</div>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenRevoke) {
        const address = isSolana ? item.to_address : item.token_approve?.spender_address || item.to_address;
        return (
            <div className="text-second text-[13px] font-medium lowercase leading-[18px]">
                <div>{formatAddress(address, 4)}</div>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenSwap) {
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                {item.project_name ? <Trans>on {item.project_name}</Trans> : formatAddress(item.to_address, 4)}
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenBridge) {
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                {item.project_name ? <Trans>via {item.project_name}</Trans> : formatAddress(item.to_address, 4)}
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.ContractInteraction) {
        const address = isSolana ? item.token_sends[0]?.recipient || item.to_address : item.to_address;
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    With <span className="lowercase">{item.project_name || formatAddress(address, 4)}</span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenSend) {
        const token = item.token_sends[0];
        if (!token) return null;
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    To <span className="lowercase">{formatAddress(token.recipient, 4)}</span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenReceive) {
        const token = item.token_receives[0];
        if (!token) return null;
        const address = isSolana ? token.sender : item.from_address;
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    From <span className="lowercase">{formatAddress(address, 4)}</span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.NftMint) {
        const nft = item.nft_receives[0];
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    With{' '}
                    <span className="lowercase">
                        {item.project_name || formatAddress(nft?.nft.address || item.to_address, 4)}
                    </span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.NftReceive) {
        const nft = item.nft_receives[0];
        if (!nft) return null;
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    From <span className="lowercase">{formatAddress(nft.sender, 4)}</span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.NftSend) {
        const nft = item.nft_sends[0];
        if (!nft) return null;
        return (
            <div className="text-second text-[13px] font-medium leading-[18px]">
                <Trans>
                    To <span className="lowercase">{formatAddress(nft.recipient, 4)}</span>
                </Trans>
            </div>
        );
    }
    return null;
}
