'use client';

import EditIcon from '@dimensiondev/assets/edit.svg';
import MuteIcon from '@dimensiondev/assets/mute.svg';
import PinnedIcon from '@dimensiondev/assets/pinned.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useState } from 'react';
import { useInterval } from 'usehooks-ts';

import { ContactAvatar } from '@/components/DirectMessages/ContactAvatar.js';
import { isConversationVisibleInTab } from '@/components/DirectMessages/conversationNavigation.js';
import {
    formatConversationTime,
    getConversationTimeRefreshInterval,
} from '@/components/DirectMessages/conversationTime.js';
import type { DirectMessageConversation, InboxTab } from '@/components/DirectMessages/types.js';

interface ConversationListProps {
    activeConversationId: string;
    conversations: DirectMessageConversation[];
    error: Error | null;
    isLoading: boolean;
    requestCount: number;
    search: string;
    selectedTab: InboxTab;
    unreadCount: number;
    onConversationSelect: (conversation: DirectMessageConversation) => void;
    onNewMessage: () => void;
    onRetry: () => void;
    onSearchChange: (value: string) => void;
    onTabChange: (tab: InboxTab) => void;
}

const TABS: Array<{ id: InboxTab; label: React.ReactNode }> = [
    { id: 'all', label: <Trans>All</Trans> },
    { id: 'unread', label: <Trans>Unread</Trans> },
    { id: 'requests', label: <Trans>Requests</Trans> },
];

export const ConversationList = memo(function ConversationList({
    activeConversationId,
    conversations,
    error,
    isLoading,
    requestCount,
    search,
    selectedTab,
    unreadCount,
    onConversationSelect,
    onNewMessage,
    onRetry,
    onSearchChange,
    onTabChange,
}: ConversationListProps) {
    const [currentTime, setCurrentTime] = useState(Date.now);
    const filteredConversations = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return conversations.filter((conversation) => {
            if (!isConversationVisibleInTab(conversation, selectedTab, activeConversationId)) return false;
            if (!normalizedSearch) return true;

            return `${conversation.name} ${conversation.handle} ${conversation.preview}`
                .toLowerCase()
                .includes(normalizedSearch);
        });
    }, [activeConversationId, conversations, search, selectedTab]);
    const timeRefreshInterval = useMemo(
        () =>
            filteredConversations.reduce<number | null>((shortestInterval, conversation) => {
                const interval = getConversationTimeRefreshInterval(conversation.lastMessageAt, currentTime);
                if (interval === null) return shortestInterval;
                return shortestInterval === null ? interval : Math.min(shortestInterval, interval);
            }, null),
        [currentTime, filteredConversations],
    );
    useInterval(() => setCurrentTime(Date.now()), timeRefreshInterval);

    return (
        <section className="flex size-full min-h-0 flex-col bg-primaryBottom md:w-[350px] md:border-r md:border-line">
            <header className="shrink-0 px-4 pb-3 pt-4">
                <div className="flex h-10 items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold leading-6 text-main">
                                <Trans>Messages</Trans>
                            </h1>
                            {unreadCount ? (
                                <span className="rounded-full bg-fireflyBrand px-2 py-0.5 text-[11px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="grid size-9 place-items-center rounded-md bg-fireflyBrand text-white transition-opacity hover:opacity-90"
                        aria-label={t`New message`}
                        onClick={onNewMessage}
                    >
                        <EditIcon width={18} height={18} />
                    </button>
                </div>

                <label className="mt-4 flex h-10 items-center gap-2 rounded-md border border-line bg-lightBg px-3 text-second transition-colors focus-within:border-fireflyBrand">
                    <SearchIcon width={16} height={16} className="shrink-0" />
                    <input
                        id="dm-conversation-search"
                        aria-keyshortcuts="Control+K Meta+K /"
                        value={search}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-main outline-none placeholder:text-second focus:ring-0"
                        placeholder={t`Search conversations`}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                    <kbd className="hidden rounded-md border border-line bg-primaryBottom px-1.5 py-0.5 text-[10px] text-second lg:block">
                        /
                    </kbd>
                </label>

                <div
                    className="mt-3 flex gap-1 rounded-md border border-secondaryLine bg-thirdBottom p-1"
                    role="tablist"
                >
                    {TABS.map((tab) => {
                        const isSelected = selectedTab === tab.id;
                        const badge = tab.id === 'unread' ? unreadCount : tab.id === 'requests' ? requestCount : 0;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                className={classNames(
                                    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded text-sm font-medium transition-colors',
                                    {
                                        'bg-lightBg text-highlight': isSelected,
                                        'text-second hover:text-highlight': !isSelected,
                                    },
                                )}
                                onClick={() => onTabChange(tab.id)}
                            >
                                {tab.label}
                                {badge ? (
                                    <span
                                        className={classNames(
                                            'grid min-w-4 place-items-center rounded-full px-1 text-[10px]',
                                            {
                                                'bg-fireflyBrand text-white': isSelected,
                                                'bg-line text-main': !isSelected,
                                            },
                                        )}
                                    >
                                        {badge}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                {isLoading ? (
                    <div className="space-y-2 px-1 py-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <div key={index} className="h-[72px] animate-pulse rounded-lg bg-lightBg" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="mx-3 mt-16 flex flex-col items-center text-center">
                        <p className="text-sm font-bold text-main">
                            <Trans>Messages could not be loaded</Trans>
                        </p>
                        <p className="mt-1 max-w-52 text-xs leading-5 text-second">
                            <Trans>Check your connection and try again.</Trans>
                        </p>
                        <button
                            type="button"
                            className="mt-4 rounded-md bg-main px-4 py-2 text-xs font-bold text-primaryBottom"
                            onClick={onRetry}
                        >
                            <Trans>Retry</Trans>
                        </button>
                    </div>
                ) : filteredConversations.length ? (
                    <div className="space-y-1">
                        {filteredConversations.map((conversation) => {
                            const isActive = activeConversationId === conversation.id;

                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    className={classNames(
                                        'group relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left transition-colors',
                                        {
                                            'bg-lightBg': isActive,
                                            'hover:bg-lightBg': !isActive,
                                        },
                                    )}
                                    onClick={() => onConversationSelect(conversation)}
                                >
                                    {isActive ? (
                                        <span className="absolute inset-y-4 left-0 w-0.5 rounded-full bg-fireflyBrand" />
                                    ) : null}
                                    <ContactAvatar {...conversation} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1.5">
                                            <span
                                                className={classNames('truncate text-sm leading-5 text-main', {
                                                    'font-bold': conversation.unreadCount > 0,
                                                    'font-medium': conversation.unreadCount === 0,
                                                })}
                                            >
                                                {conversation.name}
                                            </span>
                                            {conversation.isPinned ? (
                                                <PinnedIcon width={12} height={12} className="shrink-0 text-second" />
                                            ) : null}
                                            {conversation.isMuted ? (
                                                <MuteIcon width={12} height={12} className="shrink-0 text-second" />
                                            ) : null}
                                        </span>
                                        <span
                                            className={classNames('mt-0.5 block truncate text-xs leading-5', {
                                                'font-semibold text-main': conversation.unreadCount > 0,
                                                'text-second': conversation.unreadCount === 0,
                                            })}
                                        >
                                            {conversation.preview || <Trans>No messages yet</Trans>}
                                        </span>
                                    </span>
                                    <span className="flex h-10 shrink-0 flex-col items-end justify-between">
                                        <span className="text-[10px] font-medium text-second">
                                            {formatConversationTime(conversation.lastMessageAt) ||
                                                conversation.timestamp}
                                        </span>
                                        {conversation.unreadCount ? (
                                            <span className="grid min-w-5 place-items-center rounded-full bg-fireflyBrand px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                {conversation.unreadCount}
                                            </span>
                                        ) : (
                                            <span className="size-5" />
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mx-3 mt-16 flex flex-col items-center text-center">
                        <div className="mb-4 grid size-12 place-items-center rounded-full bg-lightBg text-second">
                            <SearchIcon width={22} height={22} />
                        </div>
                        <p className="text-sm font-bold text-main">
                            <Trans>No conversations found</Trans>
                        </p>
                        <p className="mt-1 max-w-52 text-xs leading-5 text-second">
                            <Trans>Try another name or start a new conversation.</Trans>
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
});
