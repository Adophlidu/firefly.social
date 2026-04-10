import { createLookupTableResolver, runInSafeAsync, UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { getPostEventParameters, getSelfPostEventParameters } from '@/providers/telemetry/getPostEventParameters.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

type PostActionType =
    | 'like'
    | 'unlike'
    | 'reply'
    | 'quote'
    | 'delete'
    | 'share'
    | 'repost'
    | 'undo_repost'
    | 'bookmark'
    | 'unbookmark'
    | 'collect'
    | 'submit_collect';

const resolvePostActionEventIds = createLookupTableResolver<SocialSource, Partial<Record<PostActionType, EventId>>>(
    {
        [Source.Farcaster]: {
            like: EventId.FARCASTER_POST_LIKE_SUCCESS,
            unlike: EventId.FARCASTER_POST_UNLIKE_SUCCESS,
            reply: EventId.FARCASTER_POST_REPLY_SUCCESS,
            quote: EventId.FARCASTER_POST_QUOTE_SUCCESS,
            delete: EventId.FARCASTER_POST_DELETE_SUCCESS,
            share: EventId.FARCASTER_POST_SHARE_SUCCESS,
            repost: EventId.FARCASTER_POST_REPOST_SUCCESS,
            undo_repost: EventId.FARCASTER_POST_UNDO_REPOST_SUCCESS,
            bookmark: EventId.FARCASTER_POST_BOOKMARK_SUCCESS,
            unbookmark: EventId.FARCASTER_POST_UNBOOKMARK_SUCCESS,
            collect: EventId.FARCASTER_POST_COLLECT_SUCCESS,
        },
        [Source.Lens]: {
            like: EventId.LENS_POST_LIKE_SUCCESS,
            unlike: EventId.LENS_POST_UNLIKE_SUCCESS,
            reply: EventId.LENS_POST_REPLY_SUCCESS,
            quote: EventId.LENS_POST_QUOTE_SUCCESS,
            delete: EventId.LENS_POST_DELETE_SUCCESS,
            share: EventId.LENS_POST_SHARE_SUCCESS,
            repost: EventId.LENS_POST_REPOST_SUCCESS,
            undo_repost: EventId.LENS_POST_UNDO_REPOST_SUCCESS,
            bookmark: EventId.LENS_POST_BOOKMARK_SUCCESS,
            unbookmark: EventId.LENS_POST_UNBOOKMARK_SUCCESS,
            collect: EventId.LENS_POST_COLLECT_SUCCESS,
            submit_collect: EventId.LENS_POST_COLLECT_SUBMIT,
        },
        [Source.Twitter]: {
            like: EventId.X_POST_LIKE_SUCCESS,
            unlike: EventId.X_POST_UNLIKE_SUCCESS,
            reply: EventId.X_POST_REPLY_SUCCESS,
            quote: EventId.X_POST_QUOTE_SUCCESS,
            delete: EventId.X_POST_DELETE_SUCCESS,
            share: EventId.X_POST_SHARE_SUCCESS,
            repost: EventId.X_POST_REPOST_SUCCESS,
            undo_repost: EventId.X_POST_UNDO_REPOST_SUCCESS,
            bookmark: EventId.X_POST_BOOKMARK_SUCCESS,
            unbookmark: EventId.X_POST_UNBOOKMARK_SUCCESS,
            collect: EventId.X_POST_COLLECT_SUCCESS,
        },
        [Source.Bsky]: {
            like: EventId.BSKY_POST_LIKE_SUCCESS,
            unlike: EventId.BSKY_POST_UNLIKE_SUCCESS,
            reply: EventId.BSKY_POST_REPLY_SUCCESS,
            quote: EventId.BSKY_POST_QUOTE_SUCCESS,
            delete: EventId.BSKY_POST_DELETE_SUCCESS,
            share: EventId.BSKY_POST_SHARE_SUCCESS,
            repost: EventId.BSKY_POST_REPOST_SUCCESS,
            undo_repost: EventId.BSKY_POST_UNDO_REPOST_SUCCESS,
            bookmark: EventId.BSKY_POST_BOOKMARK_SUCCESS,
            unbookmark: EventId.BSKY_POST_UNBOOKMARK_SUCCESS,
            collect: EventId.BSKY_POST_COLLECT_SUCCESS,
        },
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function capturePostActionEvent(
    action: PostActionType,
    post: Post,
    options?: {
        collectWalletAddress?: string;
        freeToCollect?: boolean;
    },
) {
    return runInSafeAsync(async () => {
        const eventIds = resolvePostActionEventIds(post.source);
        const eventId = eventIds[action];
        if (!eventId) return;

        return TelemetryProvider.captureEvent(eventId, {
            ...(action === 'delete' ? getSelfPostEventParameters(post) : getPostEventParameters(post)),
            ...(action === 'collect' && options?.collectWalletAddress
                ? {
                      ...getWalletEventParameters(options.collectWalletAddress),
                      free_collect: options.freeToCollect ?? false,
                  }
                : {}),
        });
    });
}
