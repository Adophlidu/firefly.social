'use client';

import EditIcon from '@dimensiondev/assets/edit.svg';
import MuteIcon from '@dimensiondev/assets/mute.svg';
import PinnedIcon from '@dimensiondev/assets/pinned.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { ContactAvatar } from '@/components/DirectMessages/ContactAvatar.js';
import { isConversationVisibleInTab } from '@/components/DirectMessages/conversationNavigation.js';
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

    return (
        <section className="flex size-full min-h-0 flex-col bg-primaryBottom md:w-[350px] md:border-r md:border-line">
            <header className="shrink-0 px-5 pb-4 pt-5 md:px-6 md:pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h1 className="text-[28px] font-extrabold leading-8 tracking-[-0.04em] text-main">
                                <Trans>Messages</Trans>
                            </h1>
                            {unreadCount ? (
                                <span className="rounded-full bg-fireflyBrand px-2 py-0.5 text-[11px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-xs leading-5 text-second">
                            <Trans>Private conversations across Firefly</Trans>
                        </p>
                    </div>
                    <button
                        type="button"
                        className="grid size-10 place-items-center rounded-2xl bg-main text-primaryBottom shadow-sm transition-transform hover:scale-[1.03] active:scale-95"
                        aria-label={t`New message`}
                        onClick={onNewMessage}
                    >
                        <EditIcon width={18} height={18} />
                    </button>
                </div>

                <label className="focus-within:border-fireflyBrand/40 focus-within:ring-fireflyBrand/10 mt-5 flex h-11 items-center gap-2.5 rounded-2xl border border-transparent bg-lightBg px-3.5 text-second transition-[border-color,box-shadow] focus-within:ring-2">
                    <SearchIcon width={17} height={17} className="shrink-0" />
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

                <div className="mt-4 flex gap-1 rounded-2xl bg-lightBg p-1" role="tablist">
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
                                    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all',
                                    {
                                        'bg-primaryBottom text-main shadow-sm': isSelected,
                                        'text-second hover:text-main': !isSelected,
                                    },
                                )}
                                onClick={() => onTabChange(tab.id)}
                            >
                                {tab.label}
                                {badge ? (
                                    <span
                                        className={classNames(
                                            'grid min-w-4 place-items-center rounded-full px-1 text-[9px]',
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

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-4 md:px-3">
                {isLoading ? (
                    <div className="space-y-2 px-1 py-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <div key={index} className="h-[72px] animate-pulse rounded-[20px] bg-lightBg" />
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
                            className="mt-4 rounded-xl bg-main px-4 py-2 text-xs font-bold text-primaryBottom"
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
                                        'group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] p-3 text-left transition-colors',
                                        {
                                            'bg-[#FFF3EE] dark:bg-white/10': isActive,
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
                                                    'font-extrabold': conversation.unreadCount > 0,
                                                    'font-semibold': conversation.unreadCount === 0,
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
                                            {conversation.timestamp}
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
                        <div className="mb-4 grid size-14 place-items-center rounded-[22px] bg-lightBg text-second">
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
