import type { DmAttachmentDraft } from '@/providers/orb/chat/types.js';

export type InboxTab = 'all' | 'unread' | 'requests';

export interface DirectMessageContact {
    id: string;
    targetUserId: string;
    name: string;
    handle: string;
    initials: string;
    avatarClassName?: string;
    avatarUrl?: string;
    isOnline?: boolean;
}

export interface DirectMessageConversation extends DirectMessageContact {
    preview: string;
    timestamp: string;
    unreadCount: number;
    lastReadMessageId: string | null;
    isMuted?: boolean;
    isPinned?: boolean;
    isRequest?: boolean;
}

export interface DirectMessageMedia {
    type: 'image' | 'video';
    url: string;
    coverUrl?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
}

interface DirectMessageItemBase {
    id: string;
    createdAt: string;
    timestamp: string;
    isSelf: boolean;
}

export type DirectMessageItem = DirectMessageItemBase &
    (
        | {
              kind: 'text';
              content: string;
              status?: 'pending' | 'sent' | 'failed';
              pendingAttachments?: DmAttachmentDraft[];
          }
        | {
              kind: 'media';
              content: string;
              attachments: DirectMessageMedia[];
              status?: 'pending' | 'sent' | 'failed';
              pendingAttachments?: DmAttachmentDraft[];
          }
        | {
              kind: 'sticker';
              content: string;
              url: string;
              fallbackUrl?: string;
          }
        | {
              kind: 'tip';
              content: string;
              interactiveActionId: string;
          }
        | {
              kind: 'unknown';
          }
    );

// What the composer hands off on send. Grouping the payload behind one type means a future sendable
// message type extends this (a new field) instead of widening the onSend signature everywhere.
export interface MessageDraft {
    content: string;
    attachments: DmAttachmentDraft[];
}
