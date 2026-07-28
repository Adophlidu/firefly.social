import type { DirectMessageItem } from '@/components/DirectMessages/types.js';
import type { ChatMessage } from '@/providers/orb/chat/types.js';

export function toDirectMessageItem(message: ChatMessage, account: string): DirectMessageItem {
    const isSelf =
        message.author_id.toLowerCase() === account.toLowerCase() ||
        message.author_profile?.address?.toLowerCase() === account.toLowerCase();
    const timestamp = new Date(message.created_at).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
    const baseItem = { id: message.id, createdAt: message.created_at, timestamp, isSelf };

    const mediaAttachments = message.attachments.filter(
        (attachment) => attachment.__typename === 'MediaImage' || attachment.__typename === 'MediaVideo',
    );
    if (mediaAttachments.length) {
        return {
            ...baseItem,
            kind: 'media',
            content: message.content ?? '',
            attachments: mediaAttachments.map((attachment) => ({
                type: attachment.__typename === 'MediaVideo' ? 'video' : 'image',
                url: attachment.item,
                coverUrl: attachment.cover ?? undefined,
                width: attachment.width ?? undefined,
                height: attachment.height ?? undefined,
                aspectRatio: attachment.aspectRatio ?? undefined,
            })),
            status: message.send_status,
            pendingAttachments: message.pending_attachments,
        };
    }

    const stickerUrl = message.sticker?.url || message.sticker?.metadata?.url;
    if (stickerUrl) {
        const metadataUrl = message.sticker?.metadata?.url;
        return {
            ...baseItem,
            kind: 'sticker',
            content: message.content ?? '',
            url: stickerUrl,
            fallbackUrl: metadataUrl && metadataUrl !== stickerUrl ? metadataUrl : undefined,
        };
    }

    if (message.interactive_action_id || message.pending_tip) {
        return {
            ...baseItem,
            kind: 'tip',
            content: message.content ?? '',
            interactiveActionId: message.interactive_action_id ?? undefined,
            pendingTip: message.pending_tip,
            status: message.send_status,
        };
    }

    if (message.content) {
        return {
            ...baseItem,
            kind: 'text',
            content: message.content,
            status: message.send_status,
            pendingAttachments: message.pending_attachments,
        };
    }

    return { ...baseItem, kind: 'unknown' };
}
