import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Fragment } from 'react';

import LinkIcon from '@/assets/link-square.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Link } from '@/components/Link.js';
import { ListInPage } from '@/components/ListInPage.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { groupAndSortByDate } from '@/helpers/sortAndGroupByDate.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { TransactionDetailModalRef } from '@/modals/TransactionDetailModal/TransactionDetailModal.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    TransactionState,
} from '@/providers/types/Firefly.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface Props {
    chains: number[];
    address: string;
}

export function TransactionHistory({ chains, address }: Props) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['wallet-transaction-history', address, chains],
        async queryFn({ pageParam }) {
            return FireflyEndpointProvider.getWalletHistoryTransactions(chains, address, {
                indicator: createIndicator(undefined, pageParam),
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => {
            const items = data.pages.flatMap((page) => page.data ?? EMPTY_LIST);
            return groupAndSortByDate<TransactionHistoryItem>(items, (x) =>
                dayjs.unix(Number(x.timestamp)).format('MMM DD, YYYY'),
            );
        },
    });

    return (
        <ListInPage
            source={Source.NFTs}
            queryResult={queryResult}
            VirtualListProps={{
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: getTransactionHistoryItem,
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
) {
    return (
        <Fragment key={index}>
            {item.date ? <div className="pt-4 text-sm font-medium text-second">{item.date}</div> : null}
            <TransactionHistoryItem item={item} />
        </Fragment>
    );
}

function TransactionHistoryItem({ item }: { item: TransactionHistoryItem }) {
    const content = (
        <>
            <div className="flex items-center space-x-5">
                <TransactionHistoryTokenItem item={item} />
                <div>
                    <div
                        className={classNames('text-sm font-medium', {
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
            className="my-1 flex items-center rounded-lg p-2 hover:bg-bg"
            onClick={() => {
                TransactionDetailModalRef.open({
                    transaction: item,
                });
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
                return <Trans>Receive Failed</Trans>;
            case TransactionHistoryCategory.TokenSend:
                return <Trans>Sent Failed</Trans>;
            case TransactionHistoryCategory.TokenSwap:
                return <Trans>Swapped Failed</Trans>;
            case TransactionHistoryCategory.TokenApprove:
                return <Trans>Approve Failed</Trans>;
            case TransactionHistoryCategory.TokenRevoke:
                return <Trans>Revoke Failed</Trans>;
            case TransactionHistoryCategory.NftReceive:
                return <Trans>NFT Receive Failed</Trans>;
            case TransactionHistoryCategory.NftSend:
                return <Trans>NFT Send Failed</Trans>;
            case TransactionHistoryCategory.NftMint:
                return <Trans>NFT Mint Failed</Trans>;
            case TransactionHistoryCategory.ContractInteraction:
                return <Trans>Interacted Failed</Trans>;
            default:
                safeUnreachable(category);
                return null;
        }
    }
    switch (category) {
        case TransactionHistoryCategory.TokenReceive:
            return <Trans>Receive</Trans>;
        case TransactionHistoryCategory.TokenSend:
            return <Trans>Sent</Trans>;
        case TransactionHistoryCategory.TokenSwap:
            return <Trans>Swapped</Trans>;
        case TransactionHistoryCategory.TokenApprove:
            return <Trans>Approve</Trans>;
        case TransactionHistoryCategory.TokenRevoke:
            return <Trans>Revoke</Trans>;
        case TransactionHistoryCategory.NftReceive:
            return <Trans>NFT Receive</Trans>;
        case TransactionHistoryCategory.NftSend:
            return <Trans>NFT Send</Trans>;
        case TransactionHistoryCategory.NftMint:
            return <Trans>NFT Mint</Trans>;
        case TransactionHistoryCategory.ContractInteraction:
            return <Trans>Interacted</Trans>;
        default:
            safeUnreachable(category);
            return null;
    }
}

function ItemEnd({ item }: { item: TransactionHistoryItem }) {
    if (
        item.category === TransactionHistoryCategory.TokenSwap ||
        item.category === TransactionHistoryCategory.ContractInteraction
    ) {
        return (
            <div className="ml-auto min-w-0 text-right text-sm font-medium">
                {item.token_receives[0] ? (
                    <div className="truncate text-success">
                        +{renderShrankPrice(formatPrice(item.token_receives[0].amount) ?? '-')}{' '}
                        {item.token_receives[0].token.symbol}
                    </div>
                ) : null}
                {item.token_sends[0] ? (
                    <div
                        className={classNames('truncate font-normal', {
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
        return (
            <div className="ml-auto truncate text-right text-sm font-medium">
                -{renderShrankPrice(formatPrice(item.token_approve.amount) ?? '-')} {item.token_approve.token.symbol}
            </div>
        );
    }
    const token = item.token_receives[0] || item.token_sends[0];
    if (!token) return null;
    if (item.category === TransactionHistoryCategory.TokenReceive) {
        return (
            <div className="ml-auto truncate text-right text-sm font-medium text-success">
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
        const link = resolveExplorerLink(item.chain_id, nft.nft.address, 'address');
        if (!link) return null;
        return (
            <Link href={link} className="ml-auto truncate text-right text-sm font-medium hover:underline">
                {nft.nft.symbol || <LinkIcon width={16} height={16} className="shrink-0 text-second" />}
            </Link>
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
                name={token.symbol}
            />
        );
    }
    if (
        [TransactionHistoryCategory.TokenSwap, TransactionHistoryCategory.ContractInteraction].includes(
            item.category,
        ) &&
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
                    name={tokenSend.token.symbol}
                />
                <TokenIcon
                    icon={tokenReceive.token.logo}
                    networkType={networkType}
                    chainId={chainId}
                    size={24}
                    className="!absolute left-2.5 top-2 rounded-full bg-white"
                    disableBadge
                    name={tokenReceive.token.symbol}
                />
                <div className="absolute -right-2 bottom-0 z-1 w-[14px] rounded-full bg-white p-[1px]">
                    <ChainIcon size={12} networkType={networkType} chainId={chainId} allowEmpty />
                </div>
            </div>
        );
    }

    const token = item.token_receives[0] || item.token_sends[0];
    return (
        <TokenIcon icon={token?.token?.logo} networkType={networkType} chainId={chainId} name={token?.token?.symbol} />
    );
}

function TransactionHistorySubTitle({ item }: { item: TransactionHistoryItem }) {
    if (item.category === TransactionHistoryCategory.TokenApprove) {
        const tokenApprove = item.token_approve;
        if (!tokenApprove) return null;
        return (
            <div className="text-[13px] font-medium lowercase leading-[18px] text-second">
                <div>{formatAddress(tokenApprove.spender_address, 4)}</div>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenSwap) {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                {item.project_name ? <Trans>on {item.project_name}</Trans> : formatAddress(item.to_address, 4)}
            </div>
        );
    }
    const token = item.token_receives[0] || item.token_sends[0];
    if (!token) return null;

    if (item.category === TransactionHistoryCategory.ContractInteraction) {
        return (
            <div className="text-[13px] font-medium leading-[18px]">
                <Trans>
                    With{' '}
                    <span className="lowercase">
                        {formatAddress(
                            item.token_approve?.token.address || token.token.address || token.sender || token.recipient,
                            4,
                        )}
                    </span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenSend) {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                <Trans>
                    To <span className="lowercase">{formatAddress(token.recipient, 4)}</span>
                </Trans>
            </div>
        );
    }
    if (item.category === TransactionHistoryCategory.TokenReceive) {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                <Trans>
                    From <span className="lowercase">{formatAddress(token.sender, 4)}</span>
                </Trans>
            </div>
        );
    }
    return (
        <div className="text-[13px] font-medium lowercase leading-[18px] text-second">
            {formatAddress(token.sender || token.recipient, 4)}
        </div>
    );
}
