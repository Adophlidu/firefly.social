import type { DmAttachmentDraft, MediaAttachment } from '@/providers/orb/chat/types.js';

export function createDmGifDraft(url: string, width?: number, height?: number): DmAttachmentDraft {
    return {
        id: crypto.randomUUID(),
        url,
        type: 'image/gif',
        width,
        height,
    };
}

export function createDmImageAttachment(draft: DmAttachmentDraft, index: number, url = draft.url): MediaAttachment {
    const aspectRatio = draft.width && draft.height ? draft.width / draft.height : null;
    return {
        __typename: 'MediaImage',
        id: draft.id,
        index,
        item: url,
        raw: url,
        type: draft.type,
        width: draft.width ?? null,
        height: draft.height ?? null,
        aspectRatio,
    };
}

export function createDmAttachment(
    draft: DmAttachmentDraft,
    index: number,
    url = draft.url,
    cover: string | null = null,
): MediaAttachment {
    if (!draft.type.startsWith('video/')) return createDmImageAttachment(draft, index, url);

    const width = typeof draft.width === 'number' ? Math.round(draft.width) : null;
    const height = typeof draft.height === 'number' ? Math.round(draft.height) : null;
    const duration = typeof draft.duration === 'number' ? Math.round(draft.duration) : null;
    const aspectRatio = width && height ? width / height : null;
    return {
        __typename: 'MediaVideo',
        id: draft.id,
        index,
        item: url,
        cover,
        duration,
        title: draft.file?.name ?? null,
        type: draft.type,
        width,
        height,
        aspectRatio,
    };
}

export function toDmVideoCompatibilityAttachment(attachment: MediaAttachment): MediaAttachment {
    if (attachment.__typename !== 'MediaVideo') return attachment;

    return {
        __typename: attachment.__typename,
        id: attachment.id,
        index: attachment.index,
        item: attachment.item,
        cover: attachment.cover ?? null,
        type: attachment.type,
    };
}
