'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

import LinkIcon from '@/assets/link-square.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { ListInPage } from '@/components/ListInPage.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { Tooltip } from '@/components/Tooltip.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { createIndicator } from '@/helpers/pageable.js';
import { fireflyNftProvider } from '@/providers/firefly/Nft.js';
import type { PoapHolderToken } from '@/providers/types/NFTs.js';

interface AttendeesProps {
    eventId: number;
}

export function Attendees({ eventId }: AttendeesProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['poap-event-owners', eventId],
        async queryFn({ pageParam }) {
            const indicator = createIndicator(undefined, pageParam);
            const result = await fireflyNftProvider.getPoapHolders(eventId.toString(), indicator);
            return result;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? EMPTY_LIST),
    });

    return (
        <div className="space-y-5">
            <h3 className="text-xl font-bold leading-6">
                <Trans>Attendees</Trans>
            </h3>
            <ListInPage
                source={Source.Wallet}
                queryResult={queryResult}
                VirtualListProps={{
                    listKey: `${ScrollListKey.TopCollectors}:${eventId}`,
                    computeItemKey: (index, item) => `${index}-${item.owner.id}`,
                    itemContent: (index, item) => getAttendeesItemContent(index, item),
                }}
            />
        </div>
    );
}

function AttendeesItem({ poapHolderToken }: { poapHolderToken: PoapHolderToken }) {
    const ownerAddress = poapHolderToken.owner.id as Address;
    const ensName = poapHolderToken.owner.ens;
    const addressOrEns = poapHolderToken.owner.ens ? poapHolderToken.owner.ens : poapHolderToken.owner.id;

    return (
        <div className="flex items-center justify-between pb-3">
            <Link
                href={getProfileUrl({ source: Source.Wallet, profileId: ownerAddress })}
                className="flex max-w-[calc(100%-110px)] items-center"
            >
                <Avatar
                    src={getStampAvatarByProfileId(Source.Wallet, addressOrEns)}
                    alt={ownerAddress}
                    width={30}
                    height={30}
                    size={30}
                    className="mr-2 max-h-[30px] min-w-[30px] shrink-0 rounded-full"
                />
                <div className="flex max-w-[calc(100%-38px)] items-center gap-1.5 text-left">
                    {ensName ? (
                        <TextOverflowTooltip content={addressOrEns} placement="top">
                            <div className="w-full truncate">{ensName}</div>
                        </TextOverflowTooltip>
                    ) : (
                        <Tooltip content={addressOrEns} placement="top">
                            <span>{formatAddressEthereum(ownerAddress, 4)}</span>
                        </Tooltip>
                    )}
                    <LinkIcon width={14} height={14} className="shrink-0 text-secondary" />
                </div>
            </Link>
            <WatchButton address={ownerAddress} ens={ensName} className="h-8 leading-8" />
        </div>
    );
}

function getAttendeesItemContent(index: number, poapHolderToken: PoapHolderToken) {
    return <AttendeesItem key={`${index}-${poapHolderToken.id}`} poapHolderToken={poapHolderToken} />;
}
