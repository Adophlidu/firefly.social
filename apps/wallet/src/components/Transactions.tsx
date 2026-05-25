import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileTextIcon } from 'lucide-react';
import { Fragment, type KeyboardEvent, type MouseEvent } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ListInPage } from '@/components/ListInPage.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import {
    buildTransactionPresentation,
    TransactionCategoryLabel,
    type TransactionPresentation,
} from '@/components/TransactionPresentation.js';
import { formatDate } from '@/helpers/formatDate.js';
import { useLocale } from '@/helpers/getCookies.js';
import { groupAndSortByDate } from '@/helpers/sortAndGroupByDate.js';
import { cn } from '@/lib/utils.js';
import { type TransactionHistoryItem, TransactionState } from '@/providers/types/Firefly.js';
import { getTransactionHistory } from '@/queries/firefly/getTransactionHistory.js';

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

function getTransactionHistoryItem(
    index: number,
    item: TransactionHistoryItem & {
        date?: string;
    },
    onSelectTransaction?: (item: TransactionHistoryItem) => void,
) {
    return (
        <Fragment key={index}>
            {item.date ? <div className="pt-4 text-sm font-medium text-second">{item.date}</div> : null}
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
    const presentation = buildTransactionPresentation(item);
    const openTransaction = () => {
        if (onSelectTransaction) {
            onSelectTransaction(item);
            return;
        }
        if (presentation.explorerUrl) {
            window.open(presentation.explorerUrl, '_blank');
        }
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openTransaction();
    };

    const content = (
        <>
            <div className="flex items-center space-x-5">
                <TransactionHistoryTokenItem presentation={presentation} />
                <div>
                    <div
                        className={cn('text-sm font-medium', {
                            'text-fail': item.tx_status === TransactionState.Failed,
                        })}
                    >
                        <TransactionCategoryLabel category={item.category} state={item.tx_status} />
                    </div>
                    <TransactionHistorySubTitle presentation={presentation} />
                </div>
            </div>
            <ItemEnd presentation={presentation} />
        </>
    );

    return (
        <div
            role="button"
            tabIndex={0}
            className="my-1 flex cursor-pointer items-center rounded-lg p-2 outline-none hover:bg-bg focus-visible:ring-2 focus-visible:ring-lightMain"
            onClick={openTransaction}
            onKeyDown={handleKeyDown}
        >
            {content}
        </div>
    );
}

function stopRowClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
}

function ItemEnd({ presentation }: { presentation: TransactionPresentation }) {
    const { assetEffect } = presentation;
    if (!assetEffect) return null;

    if (assetEffect.type === 'nft') {
        const content = assetEffect.symbol || <LinkIcon width={16} height={16} className="shrink-0 text-second" />;
        if (assetEffect.explorerUrl) {
            return (
                <a
                    href={assetEffect.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto truncate text-right text-sm font-medium hover:underline"
                    onClick={stopRowClick}
                >
                    {content}
                </a>
            );
        }
        return <div className="ml-auto truncate text-right text-sm font-medium">{content}</div>;
    }

    return (
        <div className="ml-auto min-w-0 text-right text-sm font-medium">
            {assetEffect.amounts.map((amount) => (
                <div
                    key={amount.id}
                    className={cn('truncate', amount.className, {
                        'text-xs font-normal': amount.compact,
                    })}
                    title={amount.title}
                >
                    {amount.prefix}
                    {amount.text}
                    {amount.symbol ? <> {amount.symbol}</> : null}
                </div>
            ))}
        </div>
    );
}

function TransactionHistoryTokenItem({ presentation }: { presentation: TransactionPresentation }) {
    const { chainId, icon, isSolana, networkType } = presentation;

    if (icon.type === 'pair') {
        return (
            <div className="relative size-8">
                <TokenIcon
                    icon={icon.sentToken.token.logo}
                    networkType={networkType}
                    chainId={chainId}
                    className="!absolute left-0 top-0 rounded-full bg-white"
                    size={24}
                    disableBadge
                    symbol={icon.sentToken.token.symbol}
                    name={icon.sentToken.token.name}
                />
                <TokenIcon
                    icon={icon.receivedToken.token.logo}
                    networkType={networkType}
                    chainId={chainId}
                    size={24}
                    className="!absolute left-2.5 top-2 rounded-full bg-white"
                    disableBadge
                    symbol={icon.receivedToken.token.symbol}
                    name={icon.receivedToken.token.name}
                />
                <div className="absolute -right-2 bottom-0 z-1 w-[14px] rounded-full bg-white p-px">
                    <ChainIcon size={12} networkType={networkType} chainId={chainId} />
                </div>
            </div>
        );
    }

    if (icon.type === 'document') {
        return (
            <span className="relative" style={{ width: 30, height: 30 }}>
                <span className="flex size-[30px] items-center justify-center rounded-full bg-main text-primaryBottom">
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
            icon={icon.icon}
            networkType={networkType}
            chainId={chainId}
            disableBadge={icon.disableBadge}
            symbol={icon.symbol}
            name={icon.name}
        />
    );
}

function formatSubtitleAddress(address: string | undefined) {
    return address ? formatAddress(address, 4) : '--';
}

function TransactionHistorySubTitle({ presentation }: { presentation: TransactionPresentation }) {
    const subtitle = presentation.listSubtitle;
    if (!subtitle) return null;

    if (subtitle.type === 'plain-address') {
        return (
            <div className="text-[13px] font-medium lowercase leading-[18px] text-second">
                <div>{formatSubtitleAddress(subtitle.address)}</div>
            </div>
        );
    }

    if (subtitle.type === 'on-project') {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                {subtitle.projectName ? (
                    <Trans>on {subtitle.projectName}</Trans>
                ) : (
                    formatSubtitleAddress(subtitle.fallbackAddress)
                )}
            </div>
        );
    }

    if (subtitle.type === 'via-project') {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                {subtitle.projectName ? (
                    <Trans>via {subtitle.projectName}</Trans>
                ) : (
                    formatSubtitleAddress(subtitle.fallbackAddress)
                )}
            </div>
        );
    }

    if (subtitle.type === 'with-address') {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                <Trans>
                    With <span className="lowercase">{subtitle.text ?? '--'}</span>
                </Trans>
            </div>
        );
    }

    if (subtitle.type === 'to-address') {
        return (
            <div className="text-[13px] font-medium leading-[18px] text-second">
                <Trans>
                    To <span className="lowercase">{subtitle.text ?? '--'}</span>
                </Trans>
            </div>
        );
    }

    return (
        <div className="text-[13px] font-medium leading-[18px] text-second">
            <Trans>
                From <span className="lowercase">{subtitle.text ?? '--'}</span>
            </Trans>
        </div>
    );
}
