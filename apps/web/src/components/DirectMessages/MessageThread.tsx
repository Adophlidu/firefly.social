'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Plural, Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ContactAvatar } from '@/components/DirectMessages/ContactAvatar.js';
import { ConversationListToggle } from '@/components/DirectMessages/ConversationListToggle.js';
import { replaceDmConversationInUrl } from '@/components/DirectMessages/dmTargetIntent.js';
import { MessageBubbleShell } from '@/components/DirectMessages/MessageBubbleShell.js';
import { MessageComposer } from '@/components/DirectMessages/MessageComposer.js';
import {
    areMessagesGrouped,
    countNewReceivedMessages,
    findFirstUnreadMessageIndex,
    findLatestServerMessage,
    resolveMessageDateKind,
    shouldShowMessageDateDivider,
} from '@/components/DirectMessages/messagePresentation.js';
import { MESSAGE_RENDERERS } from '@/components/DirectMessages/messageRenderers.js';
import {
    isNearLatestMessage,
    observeMessageMediaReady,
    shouldElevateMessageThreadHeader,
} from '@/components/DirectMessages/messageScroll.js';
import { toDirectMessageItem } from '@/components/DirectMessages/toDirectMessageItem.js';
import type { DirectMessageConversation, DirectMessageItem } from '@/components/DirectMessages/types.js';
import { BackButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { Tooltip } from '@/components/Tooltip.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import {
    flattenMessages,
    useDmLatestMessages,
    useDmMessages,
    useMarkDmRead,
    useSendDmMessage,
    useSendDmTip,
} from '@/hooks/useDirectMessages.js';
import type { TipsSuccessResult } from '@/modals/TipsModal/refs.js';
import type { UserMetadata } from '@/providers/orb/chat/types.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface MessageThreadProps {
    account: string;
    conversation: DirectMessageConversation;
    currentProfile: Profile | null;
    isConversationListCollapsed?: boolean;
    isVisible: boolean;
    // Whether this conversation is actually visible to the user. The desktop default is active;
    // a mobile conversation remains inactive until the thread view is opened.
    isActive: boolean;
    onBack?: () => void;
    onConversationListToggle?: () => void;
    headerActions?: ReactNode;
    shouldSyncConversationToUrl?: boolean;
}

const MessageDateDivider = memo(function MessageDateDivider({ createdAt }: { createdAt: string }) {
    const date = new Date(createdAt);
    const dateKind = resolveMessageDateKind(createdAt);
    const label =
        dateKind === 'today' ? (
            <Trans>Today</Trans>
        ) : dateKind === 'yesterday' ? (
            <Trans>Yesterday</Trans>
        ) : (
            date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
            })
        );

    return (
        <div className="my-5 flex items-center gap-3 text-xs font-medium text-second">
            <span className="h-px flex-1 bg-line" />
            <span>{label}</span>
            <span className="h-px flex-1 bg-line" />
        </div>
    );
});

const MessageBubble = memo(function MessageBubble({
    account,
    item,
    isGroupedWithPrevious,
    showTimestamp,
    onRetry,
}: {
    account: string;
    item: DirectMessageItem;
    isGroupedWithPrevious: boolean;
    showTimestamp: boolean;
    onRetry: () => void;
}) {
    // The shell owns alignment and the timestamp/status footer; the per-kind renderer owns the
    // content. Adding a message type means registering a renderer, never editing this dispatch.
    const MessageContent = MESSAGE_RENDERERS[item.kind];

    return (
        <MessageBubbleShell
            item={item}
            isGroupedWithPrevious={isGroupedWithPrevious}
            showTimestamp={showTimestamp}
            onRetry={onRetry}
        >
            <MessageContent item={item} account={account} />
        </MessageBubbleShell>
    );
});

export const MessageThread = memo(function MessageThread({
    account,
    conversation,
    currentProfile,
    isConversationListCollapsed,
    isVisible,
    isActive,
    onBack,
    onConversationListToggle,
    headerActions,
    shouldSyncConversationToUrl = true,
}: MessageThreadProps) {
    const messagesQuery = useDmMessages(account, conversation.id);
    const latestMessagesQuery = useDmLatestMessages(isVisible ? account : undefined, conversation.id);
    const rawMessages = useMemo(
        () =>
            flattenMessages([
                ...(messagesQuery.data?.pages ?? []),
                ...(latestMessagesQuery.data ? [latestMessagesQuery.data] : []),
            ]),
        [latestMessagesQuery.data, messagesQuery.data?.pages],
    );
    const messages = useMemo(
        () => rawMessages.map((message) => toDirectMessageItem(message, account)),
        [account, rawMessages],
    );
    const currentUser = useMemo<UserMetadata>(
        () => ({
            id: account,
            address: account,
            ownedBy: account,
            name: currentProfile?.displayName ?? null,
            handle: currentProfile?.handle ?? null,
            picture: currentProfile?.pfp ?? null,
        }),
        [account, currentProfile],
    );
    const sendMessage = useSendDmMessage(account, conversation.id, currentUser);
    const sendTip = useSendDmTip(account, conversation.id, currentUser);
    const tipIdentity = useMemo(
        () => ({ source: Source.Lens, id: conversation.targetUserId }),
        [conversation.targetUserId],
    );
    const handleTipSuccess = useCallback(
        async ({ amount, token }: TipsSuccessResult) => {
            shouldStickToBottomRef.current = true;
            setIsAtLatest(true);
            await sendTip.mutateAsync({
                messageId: crypto.randomUUID(),
                targetUserId: conversation.targetUserId,
                amount: Number(amount),
                currency: token.id,
                currencySymbol: token.symbol,
                chainId: token.chainId,
            });
        },
        [conversation.targetUserId, sendTip],
    );
    const markRead = useMarkDmRead(account, conversation.id, conversation.unreadCount, conversation.isRequest);
    const initialUnreadCountRef = useRef(conversation.unreadCount);
    const initialLastReadMessageIdRef = useRef(conversation.lastReadMessageId);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messageContentRef = useRef<HTMLDivElement>(null);
    const unreadDividerRef = useRef<HTMLDivElement>(null);
    const knownMessageIdsRef = useRef<Set<string>>(new Set());
    const latestKnownMessageTimeRef = useRef<number | undefined>(undefined);
    const shouldStickToBottomRef = useRef(initialUnreadCountRef.current === 0);
    const isInitialMediaLayoutRef = useRef(true);
    const hasCompletedInitialMediaLayoutRef = useRef(false);
    const lastReadMessageIdRef = useRef<string | null>(null);
    const [isAtLatest, setIsAtLatest] = useState(initialUnreadCountRef.current === 0);
    const [isHeaderElevated, setIsHeaderElevated] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const latestServerMessage = findLatestServerMessage(rawMessages);
    const profileUrl = getProfileUrl({ source: Source.Lens, handle: conversation.handle });
    const profileLabel = t`View profile`;
    const firstUnreadMessageIndex = useMemo(
        () => findFirstUnreadMessageIndex(messages, initialLastReadMessageIdRef.current, initialUnreadCountRef.current),
        [messages],
    );

    const scrollToLatest = useCallback((behavior: ScrollBehavior = 'auto') => {
        const container = scrollContainerRef.current;
        if (!container) return;
        shouldStickToBottomRef.current = true;
        setIsAtLatest(true);
        setNewMessageCount(0);
        container.scrollTo({ top: container.scrollHeight, behavior });
    }, []);

    const cancelInitialMediaLayout = useCallback(() => {
        if (!isInitialMediaLayoutRef.current) return;
        isInitialMediaLayoutRef.current = false;
        hasCompletedInitialMediaLayoutRef.current = true;
    }, []);

    useLayoutEffect(() => {
        if (!shouldStickToBottomRef.current) return;
        const container = scrollContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
        setIsHeaderElevated(shouldElevateMessageThreadHeader(container.scrollTop));
    }, [rawMessages]);

    useLayoutEffect(() => {
        if (messagesQuery.isPending || hasCompletedInitialMediaLayoutRef.current) return;
        const content = messageContentRef.current;
        if (!content) return;

        let animationFrame: number | undefined;
        const stopObserving = observeMessageMediaReady(content, () => {
            animationFrame = requestAnimationFrame(() => {
                if (!isInitialMediaLayoutRef.current) return;
                const container = scrollContainerRef.current;
                if (!container) return;

                const unreadDivider = unreadDividerRef.current;
                if (firstUnreadMessageIndex >= 0 && unreadDivider) {
                    container.scrollTop = Math.max(0, unreadDivider.offsetTop - 88);
                } else {
                    container.scrollTop = container.scrollHeight;
                }
                const isLatest = isNearLatestMessage(
                    container.scrollHeight,
                    container.scrollTop,
                    container.clientHeight,
                );
                shouldStickToBottomRef.current = isLatest;
                setIsHeaderElevated(shouldElevateMessageThreadHeader(container.scrollTop));
                setIsAtLatest(isLatest);
                isInitialMediaLayoutRef.current = false;
                hasCompletedInitialMediaLayoutRef.current = true;
            });
        });

        return () => {
            stopObserving();
            if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
        };
    }, [firstUnreadMessageIndex, messagesQuery.isPending, rawMessages]);

    useEffect(() => {
        const knownMessageIds = knownMessageIdsRef.current;
        const latestKnownMessageTime = latestKnownMessageTimeRef.current;
        if (knownMessageIds.size && latestKnownMessageTime !== undefined && !shouldStickToBottomRef.current) {
            const receivedMessageCount = countNewReceivedMessages(messages, knownMessageIds, latestKnownMessageTime);
            if (receivedMessageCount) setNewMessageCount((count) => count + receivedMessageCount);
        }
        knownMessageIdsRef.current = new Set(messages.map((message) => message.id));
        latestKnownMessageTimeRef.current = Math.max(
            latestKnownMessageTime ?? Number.NEGATIVE_INFINITY,
            ...messages.map((message) => new Date(message.createdAt).getTime()),
        );
    }, [messages]);

    useEffect(() => {
        const content = messageContentRef.current;
        if (!content || typeof ResizeObserver === 'undefined') return;

        const resizeObserver = new ResizeObserver(() => {
            if (!shouldStickToBottomRef.current) return;
            const container = scrollContainerRef.current;
            if (!container) return;
            container.scrollTop = container.scrollHeight;
            setIsHeaderElevated(shouldElevateMessageThreadHeader(container.scrollTop));
        });
        resizeObserver.observe(content);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (
            !isVisible ||
            !isActive ||
            !latestServerMessage ||
            latestServerMessage.id === lastReadMessageIdRef.current
        ) {
            return;
        }
        lastReadMessageIdRef.current = latestServerMessage.id;
        void markRead(latestServerMessage.id).catch(() => undefined);
    }, [isVisible, isActive, latestServerMessage, markRead]);

    const profileIdentity = (
        <>
            <ContactAvatar {...conversation} size="sm" />
            <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-main group-hover:underline">{conversation.name}</h2>
                <p className="mt-0.5 truncate text-[11px] text-second">
                    {conversation.isOnline ? <Trans>Active now</Trans> : conversation.handle}
                </p>
            </div>
        </>
    );

    return (
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-primaryBottom">
            <header
                className={classNames(
                    'absolute inset-x-0 top-0 z-20 flex h-[calc(60px+env(safe-area-inset-top))] min-w-0 items-center justify-between border-b px-3 pt-[env(safe-area-inset-top)] transition-colors md:px-4',
                    {
                        'border-line bg-primaryBottom': !isHeaderElevated,
                        'border-line bg-primaryBottom shadow-sm': isHeaderElevated,
                    },
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {onConversationListToggle ? (
                        <ConversationListToggle
                            isCollapsed={Boolean(isConversationListCollapsed)}
                            onToggle={onConversationListToggle}
                        />
                    ) : null}
                    {onBack ? <BackButton className="md:hidden" onClick={onBack} /> : null}
                    {profileUrl ? (
                        <Tooltip content={profileLabel} placement="bottom" withDelay>
                            <Link
                                href={profileUrl}
                                aria-label={profileLabel}
                                className="group -ml-1 flex min-w-0 items-center gap-2.5 rounded-md border border-transparent p-1 transition-colors hover:bg-lightBg focus-visible:border-line focus-visible:bg-lightBg focus-visible:outline-none"
                                onClick={() => {
                                    if (shouldSyncConversationToUrl) replaceDmConversationInUrl(conversation.id);
                                }}
                            >
                                {profileIdentity}
                            </Link>
                        </Tooltip>
                    ) : (
                        <div className="flex min-w-0 items-center gap-2.5">{profileIdentity}</div>
                    )}
                </div>
                {headerActions ? <div className="ml-2 flex shrink-0 items-center gap-1">{headerActions}</div> : null}
            </header>

            <div className="relative min-h-0 flex-1">
                <div
                    ref={scrollContainerRef}
                    className="no-scrollbar size-full overflow-y-auto overflow-x-hidden px-4 pb-5 pt-[calc(80px+env(safe-area-inset-top))] md:px-6"
                    onScroll={(event) => {
                        const container = event.currentTarget;
                        setIsHeaderElevated(shouldElevateMessageThreadHeader(container.scrollTop));
                        if (isInitialMediaLayoutRef.current) {
                            return;
                        }
                        const isLatest = isNearLatestMessage(
                            container.scrollHeight,
                            container.scrollTop,
                            container.clientHeight,
                        );
                        shouldStickToBottomRef.current = isLatest;
                        setIsAtLatest(isLatest);
                        if (isLatest) setNewMessageCount(0);
                    }}
                    onTouchMove={cancelInitialMediaLayout}
                    onWheel={(event) => {
                        if (event.deltaY < 0) cancelInitialMediaLayout();
                    }}
                >
                    <div ref={messageContentRef} className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col">
                        {messages.length ? null : (
                            <div className="mb-8 flex flex-col items-center pt-3 text-center">
                                <ContactAvatar {...conversation} size="lg" />
                                <h3 className="mt-3 text-base font-bold text-main">{conversation.name}</h3>
                                <p className="mt-1 text-xs text-second">{conversation.handle}</p>
                                <p className="mt-3 max-w-72 text-xs leading-5 text-second">
                                    <Trans>You follow each other on Lens. This conversation is private.</Trans>
                                </p>
                            </div>
                        )}

                        {messagesQuery.hasNextPage ? (
                            <button
                                type="button"
                                disabled={messagesQuery.isFetchingNextPage}
                                className="mx-auto mb-5 rounded-md bg-lightBg px-4 py-2 text-xs font-bold text-main"
                                onClick={() => void messagesQuery.fetchNextPage()}
                            >
                                {messagesQuery.isFetchingNextPage ? (
                                    <Trans>Loading</Trans>
                                ) : (
                                    <Trans>Load earlier messages</Trans>
                                )}
                            </button>
                        ) : null}

                        {messagesQuery.isPending ? (
                            <div className="space-y-4">
                                <div className="h-12 w-2/3 animate-pulse rounded-xl bg-lightBg" />
                                <div className="ml-auto h-12 w-1/2 animate-pulse rounded-xl bg-lightBg" />
                                <div className="h-16 w-3/4 animate-pulse rounded-xl bg-lightBg" />
                            </div>
                        ) : messagesQuery.error ? (
                            <div className="py-8 text-center">
                                <p className="text-sm font-bold text-main">
                                    <Trans>Messages could not be loaded</Trans>
                                </p>
                                <button
                                    type="button"
                                    className="mt-3 rounded-md bg-lightBg px-4 py-2 text-xs font-bold text-main"
                                    onClick={() => void messagesQuery.refetch()}
                                >
                                    <Trans>Retry</Trans>
                                </button>
                            </div>
                        ) : messages.length ? (
                            <div>
                                {messages.map((item, index) => {
                                    const previous = messages[index - 1];
                                    const next = messages[index + 1];
                                    const showDateDivider = shouldShowMessageDateDivider(previous, item);
                                    const showUnreadDivider = index === firstUnreadMessageIndex;
                                    const nextStartsDivider =
                                        index + 1 === firstUnreadMessageIndex ||
                                        (next ? shouldShowMessageDateDivider(item, next) : false);
                                    const isGroupedWithPrevious =
                                        !showDateDivider && !showUnreadDivider && areMessagesGrouped(previous, item);
                                    const showTimestamp = !next || nextStartsDivider || !areMessagesGrouped(item, next);

                                    return (
                                        <div key={item.id}>
                                            {showDateDivider ? <MessageDateDivider createdAt={item.createdAt} /> : null}
                                            {showUnreadDivider ? (
                                                <div
                                                    ref={unreadDividerRef}
                                                    className="my-5 flex items-center gap-3 text-xs font-medium text-fireflyBrand"
                                                >
                                                    <span className="bg-fireflyBrand/30 h-px flex-1" />
                                                    <Trans>New messages</Trans>
                                                    <span className="bg-fireflyBrand/30 h-px flex-1" />
                                                </div>
                                            ) : null}
                                            <MessageBubble
                                                account={account}
                                                item={item}
                                                isGroupedWithPrevious={isGroupedWithPrevious}
                                                showTimestamp={showTimestamp}
                                                onRetry={() => {
                                                    if (item.kind === 'tip') {
                                                        if (item.pendingTip) {
                                                            sendTip.mutate({
                                                                ...item.pendingTip,
                                                                messageId: item.id,
                                                                interactiveActionId: item.interactiveActionId,
                                                            });
                                                            return;
                                                        }
                                                        if (!item.interactiveActionId) return;
                                                        sendMessage.mutate({
                                                            content: '',
                                                            messageId: item.id,
                                                            attachments: [],
                                                            interactiveActionId: item.interactiveActionId,
                                                        });
                                                        return;
                                                    }
                                                    if (item.kind !== 'text' && item.kind !== 'media') return;
                                                    sendMessage.mutate({
                                                        content: item.content,
                                                        messageId: item.id,
                                                        attachments: item.pendingAttachments ?? [],
                                                    });
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-second">
                                <Trans>No messages yet. Say hello!</Trans>
                            </p>
                        )}
                    </div>
                </div>
                {!isAtLatest ? (
                    <button
                        type="button"
                        className={classNames(
                            'absolute bottom-4 right-4 flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-primaryBottom px-3 text-main shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-5 md:right-6',
                            { 'w-10 px-0': newMessageCount === 0 },
                        )}
                        aria-label={t`Back to latest message`}
                        onClick={() => scrollToLatest('smooth')}
                    >
                        <ArrowDownIcon width={18} height={18} />
                        {newMessageCount ? (
                            <span className="text-xs font-bold">
                                <Plural value={newMessageCount} one="# new message" other="# new messages" />
                            </span>
                        ) : null}
                    </button>
                ) : null}
            </div>

            <MessageComposer
                key={conversation.id}
                recipientName={conversation.name}
                tip={{ identity: tipIdentity, handle: conversation.handle, onSuccess: handleTipSuccess }}
                onSend={(draft) => {
                    shouldStickToBottomRef.current = true;
                    setIsAtLatest(true);
                    sendMessage.mutate({
                        content: draft.content,
                        attachments: draft.attachments,
                        messageId: crypto.randomUUID(),
                    });
                }}
            />
        </section>
    );
});
