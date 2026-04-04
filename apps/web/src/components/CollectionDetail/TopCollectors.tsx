'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { TableListInPage } from '@/components/TableListInPage.js';
import { Tooltip } from '@/components/Tooltip.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { getCollectionHolders } from '@/providers/firefly/nft/getCollectionHolders.js';
import { type CollectionHolder } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface TopCollectorsProps {
    chainId?: EthereumChainId;
    address: string;
}

function TopCollectorsTable(props: React.HTMLAttributes<HTMLTableElement>) {
    return <table className="w-full table-fixed px-3" {...props} />;
}

function TopCollectorsTableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className="text-center text-base font-normal leading-[30px]" {...props} />;
}

function TopCollectorsFixedHeader() {
    return (
        <tr className="text-medium font-bold leading-6">
            <th className="w-10 pb-2 pr-2 text-left">#</th>
            <th className="px-2 pb-2 text-left">
                <Trans>Address</Trans>
            </th>
            <th className={'w-[80px] pb-2 pl-2 text-right lg:pr-2 lg:text-center'}>
                <Trans>Owned</Trans>
            </th>
            <th className="hidden w-[80px] whitespace-nowrap pb-2 pl-2 text-right lg:table-cell">
                <Trans>%Owned</Trans>
            </th>
        </tr>
    );
}

const TopCollectorsComponents = {
    Table: TopCollectorsTable,
    TableRow: TopCollectorsTableRow,
};

function getTopCollectorsItemContent(index: number, item: CollectionHolder) {
    const addressOrEns = item.address;
    const profileLink =
        BlockScanExplorerResolver.addressLink(EthereumChainId.Mainnet, item.address) ||
        getProfileUrl({ source: Source.Wallet, profileId: item.address });

    return (
        <>
            <td className="pb-5 pr-2 text-left">{index + 1}</td>
            <td className="px-2 pb-5">
                <Link target="_blank" href={profileLink} className="flex w-full items-center">
                    <Avatar
                        src={getStampAvatarByProfileId(Source.Wallet, addressOrEns)}
                        alt={item.address}
                        width={30}
                        height={30}
                        size={30}
                        className="mr-2 size-[30px] shrink-0 rounded-full"
                    />
                    <div className="flex min-w-0 items-center text-left">
                        <Tooltip content={addressOrEns} placement="top" className="!max-w-[400px]">
                            <div className="truncate">{formatAddress(item.address, 4)}</div>
                        </Tooltip>
                        <LinkIcon className="text-secondary ml-1.5 size-3 shrink-0" />
                    </div>
                </Link>
            </td>
            <td className={'pb-2 pl-2 text-right lg:pr-2 lg:text-center'}>
                <div className="truncate">
                    <Tooltip content={item.value} placement="right">
                        <span>{nFormatter(item.value)}</span>
                    </Tooltip>
                </div>
            </td>
            <td className="hidden pb-5 pl-2 text-right lg:table-cell">{item.proportion}</td>
        </>
    );
}

export function TopCollectors(props: TopCollectorsProps) {
    const { address, chainId = EthereumChainId.Mainnet } = props;
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['top-collectors', chainId, address.toLowerCase()],
        async queryFn() {
            return getCollectionHolders(chainId, address);
        },
        initialPageParam: '',
        getNextPageParam: () => undefined,
        select: (data) => data.pages.flat(),
    });

    return (
        <TableListInPage
            queryResult={queryResult}
            VirtualTableListProps={{
                components: TopCollectorsComponents,
                fixedHeaderContent: TopCollectorsFixedHeader,
                key: `${ScrollListKey.TopCollectors}:${address}:${chainId}`,
                computeItemKey: (index, item) => `${item.address}-${item.address}-${index}`,
                itemContent: (index, item) => getTopCollectorsItemContent(index, item),
            }}
            className="mt-2 w-full"
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
