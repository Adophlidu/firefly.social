'use client';

import CloseIcon from '@dimensiondev/assets/close.svg';
import MessagesIcon from '@dimensiondev/assets/messages.svg';
import MinusIcon from '@dimensiondev/assets/minus.svg';
import { PageRoute, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect, useMemo, useState } from 'react';

import { ContactAvatar } from '@/components/DirectMessages/ContactAvatar.js';
import { MessageThread } from '@/components/DirectMessages/MessageThread.js';
import type { DirectMessageConversation } from '@/components/DirectMessages/types.js';
import { IconButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import type { DirectMessagePanelTarget } from '@/controllers/openDirectMessagePanel.js';
import { openLoginModal } from '@/controllers/openLoginModal.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveInitials } from '@/helpers/resolveInitials.js';
import { useAuthenticatedDmAccount, useDmTargetChannel } from '@/hooks/useDirectMessages.js';
import { useDmRealtime } from '@/hooks/useDmRealtime.js';
import type { ChatChannel } from '@/providers/orb/chat/types.js';

interface DirectMessagePanelProps {
    openRequestId: number;
    target: DirectMessagePanelTarget;
    onClose: () => void;
}

function resolvePicture(channel: ChatChannel): string | undefined {
    const picture = channel.other_member_profile?.picture;
    if (typeof picture === 'string') return picture;
    return picture?.url ?? channel.other_member_profile?.rawPicture ?? undefined;
}

function toConversation(channel: ChatChannel, target: DirectMessagePanelTarget): DirectMessageConversation {
    const profile = channel.other_member_profile;
    const name = profile?.name || profile?.handle || target.name;
    return {
        id: channel.id,
        targetUserId: profile?.address || profile?.id || target.targetUserId,
        name,
        handle: profile?.handle || target.handle,
        initials: resolveInitials(name),
        avatarUrl: resolvePicture(channel) ?? target.avatarUrl,
        preview: '',
        timestamp: '',
        unreadCount: channel.channel_membership.unread_count,
        lastReadMessageId: channel.channel_membership.last_read_message_id,
        isMuted: channel.channel_membership.is_muted,
        isPinned: channel.channel_membership.is_pinned,
        isRequest: Boolean(channel.channel_membership.chat_request_type),
    };
}

export const DirectMessagePanel = memo(function DirectMessagePanel({
    openRequestId,
    target,
    onClose,
}: DirectMessagePanelProps) {
    const { identity, authenticatedAccount } = useAuthenticatedDmAccount();
    const router = useRouter();
    const channelQuery = useDmTargetChannel(authenticatedAccount, target.targetUserId);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        setIsMinimized(false);
    }, [openRequestId]);

    const channel = channelQuery.data;
    const conversation = useMemo(() => (channel ? toConversation(channel, target) : undefined), [channel, target]);
    useDmRealtime(authenticatedAccount, conversation?.id);
    const messagesUrl = conversation
        ? `${PageRoute.Messages}?channel=${encodeURIComponent(conversation.id)}`
        : `${PageRoute.Messages}?to=${encodeURIComponent(target.targetUserId)}`;
    const panelTitle = target.name || target.handle;

    const headerActions = (
        <>
            <IconButton
                size={18}
                tooltip={<Trans>Open in Messages</Trans>}
                aria-label={t`Open in Messages`}
                className="size-8"
                onClick={() => {
                    onClose();
                    router.push(messagesUrl);
                }}
            >
                <MessagesIcon width={18} height={18} />
            </IconButton>
            <IconButton
                size={18}
                tooltip={<Trans>Minimize</Trans>}
                aria-label={t`Minimize`}
                className="size-8"
                onClick={() => setIsMinimized(true)}
            >
                <MinusIcon width={18} height={18} />
            </IconButton>
            <IconButton
                size={18}
                tooltip={<Trans>Close</Trans>}
                aria-label={t`Close`}
                className="size-8"
                onClick={onClose}
            >
                <CloseIcon width={18} height={18} />
            </IconButton>
        </>
    );

    return (
        <div className="pointer-events-none fixed bottom-0 left-1/2 z-50 h-0 w-full max-w-[1265px] -translate-x-1/2 max-md:hidden">
            <section
                aria-label={t`Conversation with ${panelTitle}`}
                className={classNames(
                    'pointer-events-auto absolute right-4 w-[385px] origin-bottom-right overflow-hidden rounded-xl border border-line bg-primaryBottom text-main shadow-lg transition-[height,bottom] duration-300 lg:right-0',
                    {
                        'bottom-16 h-[60px]': isMinimized,
                        'bottom-0 h-[min(600px,calc(100dvh-32px))]': !isMinimized,
                    },
                )}
            >
                {isMinimized ? (
                    <div className="absolute inset-x-0 top-0 z-40 flex h-[60px] w-full items-center gap-3 bg-lightBg px-4 text-left">
                        <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            onClick={() => setIsMinimized(false)}
                        >
                            <ContactAvatar
                                name={panelTitle}
                                initials={resolveInitials(panelTitle)}
                                avatarUrl={target.avatarUrl}
                                size="sm"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">{panelTitle}</span>
                        </button>
                        <button
                            type="button"
                            aria-label={t`Close`}
                            className="grid size-8 place-items-center rounded hover:bg-bg"
                            onClick={onClose}
                        >
                            <CloseIcon width={18} height={18} />
                        </button>
                    </div>
                ) : null}

                {!identity ? (
                    <div className="flex size-full flex-col items-center justify-center px-8 text-center">
                        <div className="grid size-14 place-items-center rounded-full bg-lightBg text-main">
                            <MessagesIcon width={24} height={24} />
                        </div>
                        <h2 className="mt-4 text-base font-bold">
                            <Trans>Sign in to send a message</Trans>
                        </h2>
                        <button
                            type="button"
                            className="mt-5 rounded-xl bg-main px-5 py-2.5 text-sm font-bold text-primaryBottom"
                            onClick={() => openLoginModal({ source: Source.Lens })}
                        >
                            <Trans>Sign in with Lens</Trans>
                        </button>
                        <div className="absolute right-3 top-3">
                            <IconButton aria-label={t`Close`} onClick={onClose}>
                                <CloseIcon width={18} height={18} />
                            </IconButton>
                        </div>
                    </div>
                ) : conversation ? (
                    <MessageThread
                        key={`${identity.account}-${conversation.id}`}
                        account={identity.account}
                        conversation={conversation}
                        currentProfile={identity.profile}
                        isVisible={!isMinimized}
                        isActive={!isMinimized}
                        headerActions={headerActions}
                        shouldSyncConversationToUrl={false}
                    />
                ) : channelQuery.isError ? (
                    <div className="flex size-full flex-col items-center justify-center px-8 text-center">
                        <p className="text-sm font-bold">
                            <Trans>This conversation could not be opened.</Trans>
                        </p>
                        <button
                            type="button"
                            className="mt-4 rounded-lg bg-lightBg px-4 py-2 text-sm font-bold"
                            onClick={() => {
                                void channelQuery.refetch();
                            }}
                        >
                            <Trans>Retry</Trans>
                        </button>
                        <div className="absolute right-3 top-3">
                            <IconButton aria-label={t`Close`} onClick={onClose}>
                                <CloseIcon width={18} height={18} />
                            </IconButton>
                        </div>
                    </div>
                ) : (
                    <div className="grid size-full place-items-center">
                        <LoadingIcon size={24} />
                        <div className="absolute right-3 top-3">
                            <IconButton aria-label={t`Close`} onClick={onClose}>
                                <CloseIcon width={18} height={18} />
                            </IconButton>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
});
