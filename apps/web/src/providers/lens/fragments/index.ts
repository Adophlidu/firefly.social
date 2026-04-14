import type { FragmentOf } from '@lens-protocol/client';

import { CommentNotificationFragment } from '@/providers/lens/fragments/notification/CommentNotification.js';
import { QuoteNotificationFragment } from '@/providers/lens/fragments/notification/QuoteNotification.js';
import { MediaImageFragment } from '@/providers/lens/fragments/post/MediaImage.js';
import { PostFragment } from '@/providers/lens/fragments/post/Post.js';
import { ReferencedPostFragment } from '@/providers/lens/fragments/post/ReferencedPost.js';

declare module '@lens-protocol/client' {
    export interface CommentNotification extends FragmentOf<typeof CommentNotificationFragment> {}
    export interface QuoteNotification extends FragmentOf<typeof QuoteNotificationFragment> {}
}

export const fragments = [
    PostFragment,
    CommentNotificationFragment,
    QuoteNotificationFragment,
    MediaImageFragment,
    ReferencedPostFragment,
];
