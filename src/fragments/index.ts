import { type FragmentOf } from '@lens-protocol/client';

import { CommentNotificationFragment } from '@/fragments/notification/CommentNotification.js';
import { QuoteNotificationFragment } from '@/fragments/notification/QuoteNotification.js';
import { MediaImageFragment } from '@/fragments/post/MediaImage.js';
import { PostFragment } from '@/fragments/post/Post.js';
import { ReferencedPostFragment } from '@/fragments/post/ReferencedPost.js';

declare module '@lens-protocol/client' {
    export interface Post extends FragmentOf<typeof PostFragment> {}
    export interface ReferencedPost extends FragmentOf<typeof ReferencedPostFragment> {}
    export interface MediaImage extends FragmentOf<typeof MediaImageFragment> {}
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
