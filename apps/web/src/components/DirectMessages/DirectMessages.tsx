'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { ConversationList } from '@/components/DirectMessages/ConversationList.js';
import { ConversationListToggle } from '@/components/DirectMessages/ConversationListToggle.js';
import {
    clearViewedConversationUnread,
    resolveAdjacentConversationIndex,
    resolveConversationState,
    type RetainedConversation,
} from '@/components/DirectMessages/conversationNavigation.js';
import {
    clearDmTargetIntent,
    getDmRetainedConversation,
    replaceDmConversationInUrl,
    replaceDmInboxTabInUrl,
} from '@/components/DirectMessages/dmTargetIntent.js';
import { isDmThreadActive, isDmThreadVisible } from '@/components/DirectMessages/messageScroll.js';
import { MessageThread } from '@/components/DirectMessages/MessageThread.js';
import { NewMessageModal } from '@/components/DirectMessages/NewMessageModal.js';
import type { DirectMessageContact, DirectMessageConversation, InboxTab } from '@/components/DirectMessages/types.js';
import { useDebouncedDmSearch } from '@/components/DirectMessages/useDebouncedDmSearch.js';
import { openLoginModal } from '@/controllers/openLoginModal.js';
import { useSearchParams } from '@/esm/navigation.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { getTwitterFormat } from '@/helpers/formatTimestamp.js';
import { resolveInitials } from '@/helpers/resolveInitials.js';
import {
    mergeDmChannels,
    mergeDmLastMessages,
    useAuthenticatedDmAccount,
    useDmChannels,
    useDmCounters,
    useDmLastMessages,
    useStartDmChat,
} from '@/hooks/useDirectMessages.js';
import { useDmRealtime } from '@/hooks/useDmRealtime.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { isSameDmAccount } from '@/providers/orb/chat/isSameDmAccount.js';
import type { ChatChannel, ChatMessage, UserMetadata } from '@/providers/orb/chat/types.js';

const CONVERSATION_LIST_COLLAPSED_STORAGE_KEY = 'dm-conversation-list-collapsed';

function resolvePicture(profile: UserMetadata | null): string | undefined {
    if (typeof profile?.picture === 'string') return profile.picture;
    return profile?.picture?.url ?? profile?.rawPicture ?? undefined;
}

function formatConversationTime(value: string | null) {
    return value ? getTwitterFormat(value) : '';
}

function toConversation(
    channel: ChatChannel,
    lastMessage: ChatMessage | undefined,
    isRequest: boolean,
): DirectMessageConversation {
    const profile = channel.other_member_profile;
    const name = profile?.name || profile?.handle || channel.name;
    const handle = profile?.handle || profile?.address || '';

    return {
        id: channel.id,
        targetUserId: profile?.address || profile?.id || '',
        name,
        handle,
        initials: resolveInitials(name),
        avatarUrl: resolvePicture(profile),
        preview:
            lastMessage?.content ||
            (lastMessage?.interactive_action_id
                ? t`Payment request`
                : lastMessage?.attachments.length
                  ? t`Media attachment`
                  : ''),
        timestamp: formatConversationTime(lastMessage?.created_at ?? channel.last_message_at),
        unreadCount: channel.channel_membership.unread_count,
        lastReadMessageId: channel.channel_membership.last_read_message_id,
        isMuted: channel.channel_membership.is_muted,
        isPinned: channel.channel_membership.is_pinned,
        isRequest,
    };
}

const SignedOutState = memo(function SignedOutState() {
    return (
        <div className="flex size-full flex-col items-center justify-center px-6 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-lightBg text-main">
                <MessagesIcon width={28} height={28} />
            </div>
            <h1 className="mt-5 text-xl font-extrabold text-main">
                <Trans>Sign in to view messages</Trans>
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-second">
                <Trans>Your messages follow the currently active Lens account.</Trans>
            </p>
            <button
                type="button"
                className="mt-6 rounded-2xl bg-main px-5 py-2.5 text-sm font-bold text-primaryBottom"
                onClick={() => openLoginModal({ source: Source.Lens })}
            >
                <Trans>Sign in with Lens</Trans>
            </button>
        </div>
    );
});

export const DirectMessages = memo(function DirectMessages() {
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('to')?.trim();
    const initialConversationId = searchParams.get('channel')?.trim() || undefined;
    const tabParam = searchParams.get('tab');
    const initialTab: InboxTab = tabParam === 'unread' || tabParam === 'requests' ? tabParam : 'all';
    const { identity, account, authenticatedAccount } = useAuthenticatedDmAccount();
    const [activeConversationId, setActiveConversationId] = useState<string | undefined>(initialConversationId);
    const [retainedConversation, setRetainedConversation] = useState<RetainedConversation>();
    const [restoredConversation, setRestoredConversation] = useState<RetainedConversation>();
    const [isMobileThreadOpen, setIsMobileThreadOpen] = useState(Boolean(initialConversationId));
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<InboxTab>(initialTab);
    const [search, setSearch] = useState('');
    const [startedChannels, setStartedChannels] = useState<ChatChannel[]>([]);
    const lastMessageCacheRef = useRef(new Map<string, ChatMessage>());
    const [isConversationListCollapsed, setIsConversationListCollapsed] = useLocalStorage(
        CONVERSATION_LIST_COLLAPSED_STORAGE_KEY,
        false,
        { initializeWithValue: false },
    );
    const handledIntentRef = useRef<string | undefined>(undefined);
    const previousAccountRef = useRef<string | undefined>(undefined);
    const isDesktop = useIsMedium();
    const debouncedSearch = useDebouncedDmSearch(search);
    const isRequests = selectedTab === 'requests';
    const channelParams = useMemo(
        () => ({
            type: 'dm' as const,
            ...(selectedTab === 'unread' ? { isUnread: true } : {}),
            ...(debouncedSearch.trim() ? { searchText: debouncedSearch.trim() } : {}),
        }),
        [debouncedSearch, selectedTab],
    );
    const channelsQuery = useDmChannels(authenticatedAccount, channelParams, isRequests);
    const rawChannels = useMemo(
        () => mergeDmChannels(channelsQuery.data?.pages, startedChannels),
        [channelsQuery.data?.pages, startedChannels],
    );
    const channelsWithoutLastMessage = useMemo(
        // Orb may either omit last_message or return it as an explicit null; both mean we need to
        // fetch the preview separately, so treat any missing value the same rather than only undefined.
        () => rawChannels.filter((channel) => !channel.last_message),
        [rawChannels],
    );
    const lastMessages = useDmLastMessages(authenticatedAccount, channelsWithoutLastMessage);
    const resolvedLastMessages = useMemo(
        () => mergeDmLastMessages(rawChannels, lastMessages, lastMessageCacheRef.current),
        [lastMessages, rawChannels],
    );
    useEffect(() => {
        lastMessageCacheRef.current = resolvedLastMessages;
    }, [resolvedLastMessages]);
    const conversations = useMemo(
        () => rawChannels.map((channel) => toConversation(channel, resolvedLastMessages.get(channel.id), isRequests)),
        [isRequests, rawChannels, resolvedLastMessages],
    );
    const { activeConversation, displayedConversations } = useMemo(
        () =>
            resolveConversationState({
                activeConversationId,
                conversations,
                restoredConversation,
                retainedConversation,
                selectedTab,
            }),
        [activeConversationId, conversations, restoredConversation, retainedConversation, selectedTab],
    );
    const counters = useDmCounters(authenticatedAccount);
    const isThreadVisible = isDmThreadVisible(isDesktop, isMobileThreadOpen);
    const isActiveConversationViewed = isDmThreadActive(Boolean(activeConversation), isDesktop, isMobileThreadOpen);
    const viewedConversationId = isActiveConversationViewed ? activeConversation?.id : undefined;
    const isActiveChannelCounterRefreshSuppressed = useDmRealtime(authenticatedAccount, viewedConversationId);
    const visibleUnreadCount = Math.max(
        0,
        (counters.data?.total_unread_count ?? 0) -
            (isActiveConversationViewed && !isActiveChannelCounterRefreshSuppressed
                ? (activeConversation?.unreadCount ?? 0)
                : 0),
    );
    const visibleConversations = useMemo(
        () => clearViewedConversationUnread(displayedConversations, viewedConversationId),
        [displayedConversations, viewedConversationId],
    );
    const highlightedConversationId = activeConversation?.id ?? '';
    const startChat = useStartDmChat(authenticatedAccount ?? '__signed-out__');
    const retainStartedChannel = useCallback((channel: ChatChannel) => {
        setStartedChannels((currentChannels) => [
            channel,
            ...currentChannels.filter((currentChannel) => currentChannel.id !== channel.id),
        ]);
    }, []);
    const selectStartedChannel = useCallback(
        (channel: ChatChannel) => {
            retainStartedChannel(channel);
            replaceDmConversationInUrl(channel.id);
            setActiveConversationId(channel.id);
            setIsMobileThreadOpen(true);
        },
        [retainStartedChannel],
    );
    const handleConversationListToggle = useCallback(() => {
        setIsConversationListCollapsed((currentValue) => !currentValue);
    }, [setIsConversationListCollapsed]);
    const handleTabChange = useCallback((tab: InboxTab) => {
        replaceDmInboxTabInUrl(tab);
        setSelectedTab(tab);
    }, []);
    const handleConversationSelect = useCallback(
        (conversation: DirectMessageConversation) => {
            if (account) {
                replaceDmConversationInUrl(conversation.id, {
                    account,
                    retainedConversation: {
                        conversation: { ...conversation, unreadCount: 0 },
                        tab: selectedTab,
                    },
                });
            }
            setActiveConversationId(conversation.id);
            setRetainedConversation({ conversation, tab: selectedTab });
            setRestoredConversation(undefined);
            setIsMobileThreadOpen(true);
        },
        [account, selectedTab],
    );

    useEffect(() => {
        if (!account) return;
        const previousAccount = previousAccountRef.current;
        previousAccountRef.current = account;
        if (!previousAccount || previousAccount === account) return;

        replaceDmConversationInUrl();
        setActiveConversationId(undefined);
        setRetainedConversation(undefined);
        setRestoredConversation(undefined);
        setIsMobileThreadOpen(false);
        setIsNewMessageOpen(false);
        setStartedChannels([]);
        lastMessageCacheRef.current.clear();
        handledIntentRef.current = undefined;
    }, [account]);

    useEffect(() => {
        if (!account || !initialConversationId) return;
        const restoredConversation = getDmRetainedConversation(account, initialConversationId);
        if (restoredConversation) {
            setRestoredConversation(restoredConversation);
        }
    }, [account, initialConversationId]);

    useEffect(() => {
        if (!authenticatedAccount || !targetUserId || !channelsQuery.isSuccess) return;
        if (isSameDmAccount(authenticatedAccount, targetUserId)) {
            clearDmTargetIntent();
            return;
        }

        const intentKey = `${authenticatedAccount.toLowerCase()}:${targetUserId.toLowerCase()}`;
        if (handledIntentRef.current === intentKey) return;
        handledIntentRef.current = intentKey;

        const existingConversation = conversations.find(
            (conversation) => conversation.targetUserId.toLowerCase() === targetUserId.toLowerCase(),
        );
        if (existingConversation) {
            handleConversationSelect(existingConversation);
            clearDmTargetIntent();
            return;
        }

        void startChat
            .mutateAsync(targetUserId)
            .then((channel) => {
                selectStartedChannel(channel);
                clearDmTargetIntent();
            })
            .catch((error: unknown) => {
                if (handledIntentRef.current === intentKey) handledIntentRef.current = undefined;
                enqueueMessageFromError(error, <Trans>Failed to start the conversation.</Trans>);
            });
    }, [
        authenticatedAccount,
        channelsQuery.isSuccess,
        conversations,
        handleConversationSelect,
        selectStartedChannel,
        startChat,
        targetUserId,
    ]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target instanceof HTMLElement ? event.target : null;
            const isEditable =
                target?.isContentEditable ||
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement;
            const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

            if (isSearchShortcut || (event.key === '/' && !isEditable)) {
                const searchInput = document.querySelector<HTMLInputElement>('#dm-conversation-search');
                if (!searchInput) return;
                event.preventDefault();
                searchInput.focus();
                return;
            }
            if (isEditable || isNewMessageOpen) return;
            if (event.key === 'Escape' && isMobileThreadOpen) {
                setIsMobileThreadOpen(false);
                return;
            }
            if ((event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || !displayedConversations.length) return;
            if (target && target !== document.body && !target.closest('#dm-conversation-list')) return;

            event.preventDefault();
            const currentIndex = displayedConversations.findIndex(
                (conversation) => conversation.id === activeConversationId,
            );
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const nextIndex = resolveAdjacentConversationIndex(currentIndex, displayedConversations.length, direction);
            const nextConversation = displayedConversations[nextIndex];
            if (nextConversation) handleConversationSelect(nextConversation);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeConversationId, displayedConversations, handleConversationSelect, isMobileThreadOpen, isNewMessageOpen]);

    if (!identity) {
        return (
            <div className="h-dvh min-h-0 w-full overflow-hidden bg-primaryBottom md:border-r md:border-line">
                <SignedOutState />
            </div>
        );
    }

    const handleContactSelect = async (contact: DirectMessageContact) => {
        // Both the search result and existing conversations key targetUserId on the wallet address,
        // so the address match below is the primary path; the handle match is a defensive fallback.
        const contactHandle = contact.handle.trim().toLowerCase();
        const existingConversation = conversations.find(
            (conversation) =>
                conversation.targetUserId.toLowerCase() === contact.targetUserId.toLowerCase() ||
                (Boolean(contactHandle) && conversation.handle.trim().toLowerCase() === contactHandle),
        );
        if (existingConversation) {
            handleConversationSelect(existingConversation);
            setIsNewMessageOpen(false);
            return;
        }

        try {
            const channel = await startChat.mutateAsync(contact.targetUserId);
            selectStartedChannel(channel);
            setIsNewMessageOpen(false);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to start the conversation.</Trans>);
        }
    };

    return (
        <div className="h-dvh min-h-0 w-full overflow-hidden bg-primaryBottom md:border-r md:border-line">
            <div className="flex h-full min-h-0">
                <div
                    id="dm-conversation-list"
                    inert={isDesktop ? isConversationListCollapsed : false}
                    aria-hidden={isDesktop ? isConversationListCollapsed : false}
                    className={classNames(
                        'shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none',
                        isMobileThreadOpen ? 'hidden md:flex' : 'flex w-full',
                        {
                            'md:pointer-events-none md:w-0 md:opacity-0': isConversationListCollapsed,
                            'md:w-[350px] md:opacity-100': !isConversationListCollapsed,
                        },
                    )}
                >
                    <ConversationList
                        activeConversationId={highlightedConversationId}
                        conversations={visibleConversations}
                        error={channelsQuery.error}
                        isLoading={channelsQuery.isPending}
                        requestCount={counters.data?.requests_count ?? 0}
                        search={search}
                        selectedTab={selectedTab}
                        unreadCount={visibleUnreadCount}
                        onConversationSelect={handleConversationSelect}
                        onNewMessage={() => setIsNewMessageOpen(true)}
                        onRetry={() => void channelsQuery.refetch()}
                        onSearchChange={setSearch}
                        onTabChange={handleTabChange}
                    />
                </div>

                <div className={isMobileThreadOpen ? 'flex min-w-0 flex-1' : 'hidden min-w-0 flex-1 md:flex'}>
                    {activeConversation ? (
                        <MessageThread
                            key={`${identity.account}-${activeConversation.id}`}
                            account={identity.account}
                            conversation={activeConversation}
                            currentProfile={identity.profile}
                            isConversationListCollapsed={isConversationListCollapsed}
                            isVisible={isThreadVisible}
                            isActive={isActiveConversationViewed}
                            onBack={() => setIsMobileThreadOpen(false)}
                            onConversationListToggle={handleConversationListToggle}
                        />
                    ) : (
                        <div className="relative flex flex-1 items-center justify-center text-sm text-second">
                            <ConversationListToggle
                                className="absolute left-4 top-4"
                                isCollapsed={isConversationListCollapsed}
                                onToggle={handleConversationListToggle}
                            />
                            <Trans>Select a conversation or start a new one.</Trans>
                        </div>
                    )}
                </div>
            </div>

            <NewMessageModal
                account={identity.account}
                contacts={conversations}
                open={isNewMessageOpen}
                onClose={() => setIsNewMessageOpen(false)}
                onSelect={handleContactSelect}
            />
        </div>
    );
});
