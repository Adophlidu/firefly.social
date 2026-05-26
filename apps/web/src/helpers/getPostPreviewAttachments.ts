import { SUPPORTED_PREVIEW_MEDIA_TYPES } from '@dimensiondev/constants/computed';
import { AttachmentType } from '@dimensiondev/enums';

import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

const GALLERY_MEDIA_TYPES: AttachmentType[] = [...SUPPORTED_PREVIEW_MEDIA_TYPES, AttachmentType.Video];

export function getPostPreviewAttachments(post: Post): Attachment[] {
    return post.metadata.content?.attachments?.filter((x) => GALLERY_MEDIA_TYPES.includes(x.type)) ?? [];
}

export function hasPostPreviewAttachments(post: Post): boolean {
    return getPostPreviewAttachments(post).length > 0;
}
