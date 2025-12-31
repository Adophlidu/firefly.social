import { createLookupTableResolver, safeUnreachable , UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import {
    getProfileEventParameters,
    getSelfProfileEventParameters,
} from '@/providers/telemetry/getProfileEventParameters.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import {
    EventId,
    type FarcasterEventParameters,
    type FarcasterPostEventParameters,
    type LensEventParameters,
    type LensPostEventParameters,
    type TwitterEventParameters,
    type TwitterPostEventParameters,
} from '@/providers/types/Telemetry.js';
import type { ComposeType, CompositePost } from '@/types/compose.js';

const resolveComposeEventId = createLookupTableResolver<SocialSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_POST_SEND_SUCCESS,
        [Source.Lens]: EventId.LENS_POST_SEND_SUCCESS,
        [Source.Twitter]: EventId.X_POST_SEND_SUCCESS,
        [Source.Bsky]: EventId.BSKY_POST_SEND_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

const resolveReplyEventId = createLookupTableResolver<SocialSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_POST_REPLY_SUCCESS,
        [Source.Lens]: EventId.LENS_POST_REPLY_SUCCESS,
        [Source.Twitter]: EventId.X_POST_REPLY_SUCCESS,
        [Source.Bsky]: EventId.BSKY_POST_REPLY_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

const resolveQuoteEventId = createLookupTableResolver<SocialSource, EventId>(
    {
        [Source.Farcaster]: EventId.FARCASTER_POST_QUOTE_SUCCESS,
        [Source.Lens]: EventId.LENS_POST_QUOTE_SUCCESS,
        [Source.Twitter]: EventId.X_POST_QUOTE_SUCCESS,
        [Source.Bsky]: EventId.BSKY_POST_QUOTE_SUCCESS,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function getPostEventId(type: ComposeType, source: SocialSource, post: CompositePost) {
    switch (type) {
        case 'compose':
            return resolveComposeEventId(source);
        case 'quote':
            return resolveQuoteEventId(source);
        case 'reply':
            return resolveReplyEventId(source);
        default:
            safeUnreachable(type);
            throw new UnreachableError('type', type);
    }
}

export function getSelfPostEventParameters(post: Post) {
    const { source, postId } = post;
    const parameters = getSelfProfileEventParameters(source);

    switch (source) {
        case Source.Farcaster:
            return {
                ...parameters,
                farcaster_cast_id: postId,
            };
        case Source.Lens:
            return {
                ...parameters,
                lens_post_id: postId,
            };
        case Source.Twitter:
            return {
                ...parameters,
                x_post_id: postId,
            };
        case Source.Bsky:
            return {
                ...parameters,
                bsky_post_id: postId,
            };
        default:
            safeUnreachable(source);
            throw new UnreachableError('source', source);
    }
}

export function getPostEventParameters(post: Post) {
    const { source, postId, author } = post;
    const parameters = getProfileEventParameters(author);

    switch (source) {
        case Source.Farcaster:
            return {
                ...(parameters as FarcasterEventParameters),
                target_farcaster_cast_id: postId,
            } satisfies FarcasterPostEventParameters;
        case Source.Lens:
            return {
                ...(parameters as LensEventParameters),
                target_lens_post_id: postId,
            } satisfies LensPostEventParameters;
        case Source.Twitter:
            return {
                ...(parameters as TwitterEventParameters),
                target_x_post_id: postId,
            } satisfies TwitterPostEventParameters;
        case Source.Bsky:
            return {
                ...parameters,
                target_bsky_post_id: postId,
            };
        default:
            safeUnreachable(source);
            throw new UnreachableError('source', source);
    }
}
