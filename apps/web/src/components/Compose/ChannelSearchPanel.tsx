'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import UserIcon from '@dimensiondev/assets/user.svg';
import { classNames } from '@dimensiondev/utils';
import { PopoverPanel, Transition } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { Fragment, type HTMLProps, useState } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isSameChannel } from '@/helpers/isSameChannel.js';
import { resolveChannelName } from '@/helpers/resolveChannelName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSearchChannels } from '@/hooks/useSearchChannel.js';
import {
    captureFarcasterChannelChangeClickEvent,
    captureLensClubChangeClickEvent,
} from '@/providers/telemetry/captureClickEvent.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface ChannelSearchPanelProps extends HTMLProps<HTMLDivElement> {
    onSelected?: () => void;
    source: SocialSource;
}

export function ChannelSearchPanel({ onSelected, className, source, ...rest }: ChannelSearchPanelProps) {
    const isMedium = useIsMedium();

    const [inputText, setInputText] = useState('');
    const { updateChannel } = useComposeStateStore();
    const { channel: selectedChannel, rpPayload } = useCompositePost();

    const { data, isLoading, isError } = useSearchChannels(inputText, source, !!rpPayload);

    const InputBox = (
        <div className="bg-lightBg text-main relative mx-0 flex h-10 grow items-center rounded-xl px-3 md:mx-3">
            <SearchIcon width={18} height={18} className="shrink-0" />
            <SearchInput
                className="h-8"
                value={inputText}
                onChange={(ev) => setInputText(ev.currentTarget.value)}
                onClear={() => setInputText('')}
            />
        </div>
    );
    const renderChannelIcon = (channel: Channel) => {
        if (channel.id === 'home' && !channel.imageUrl) {
            return <SocialSourceIcon source={channel.source} className="mr-2 size-6" />;
        }
        return (
            <Avatar className="mr-2 shrink-0 rounded-full border" src={channel.imageUrl} size={24} alt={channel.name} />
        );
    };

    const ListBox = (
        <div className={classNames('no-scrollbar overflow-auto', className)} {...rest}>
            {isLoading ? (
                <div className="text-main m-auto flex h-[100px] items-center justify-center text-center text-sm">
                    <LoadingIcon />
                </div>
            ) : isError ? (
                <p className="text-main m-auto flex h-[100px] items-center justify-center text-center text-sm">
                    <Trans>Something went wrong. Please try again.</Trans>
                </p>
            ) : !data?.length ? (
                <p className="text-main m-auto flex h-[100px] items-center justify-center text-center text-sm">
                    <Trans>There is no data available for display.</Trans>
                </p>
            ) : (
                data.map((channel) => {
                    const isSelected = isSameChannel(channel, selectedChannel[channel.source]);
                    const channelName = resolveChannelName(channel, false);

                    return channel.unavailable || !channelName ? null : (
                        <Fragment key={channel.id}>
                            <div
                                className="hover:bg-lightBg flex h-12 cursor-pointer items-center justify-between px-3 transition duration-150 ease-in"
                                onClick={() => {
                                    if (!isSelected) updateChannel(channel);
                                    onSelected?.();
                                    if (channel.source === Source.Farcaster) captureFarcasterChannelChangeClickEvent();
                                    if (channel.source === Source.Lens) captureLensClubChangeClickEvent();
                                }}
                            >
                                <div
                                    className="flex h-6 items-center overflow-hidden"
                                    style={{ width: 'calc(100% - 40px)' }}
                                >
                                    {renderChannelIcon(channel)}
                                    <div
                                        className="text-secondary flex items-center gap-1"
                                        style={{ width: 'calc(100% - 34px)' }}
                                    >
                                        <span
                                            className={classNames(
                                                'max-w-[70%] truncate font-bold',
                                                isSelected ? 'text-main' : '',
                                            )}
                                        >
                                            {channelName}
                                        </span>
                                        {channel.followerCount ? (
                                            <data className="flex items-center gap-1" value={channel.followerCount}>
                                                <UserIcon width={16} height={16} />
                                                <span className="">{nFormatter(channel.followerCount)}</span>
                                            </data>
                                        ) : null}
                                    </div>
                                </div>
                                <CircleCheckboxIcon checked={isSelected} />
                            </div>
                        </Fragment>
                    );
                })
            )}
        </div>
    );

    const content = (
        <div className="md:bg-lightBottom md:dark:bg-darkBottom flex flex-col gap-2">
            {[Source.Farcaster].includes(source) ? InputBox : null}
            {ListBox}
        </div>
    );

    if (isMedium)
        return (
            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0 translate-y-1"
            >
                <PopoverPanel
                    portal
                    anchor="top"
                    className={classNames(
                        'no-scrollbar bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom absolute bottom-full right-0 z-10 w-[350px] -translate-y-3 rounded-lg py-3 dark:border dark:shadow-none',
                        {
                            '[--anchor-max-height:264px]': [Source.Farcaster, Source.Lens].includes(source),
                        },
                    )}
                >
                    {content}
                </PopoverPanel>
            </Transition>
        );

    return content;
}
