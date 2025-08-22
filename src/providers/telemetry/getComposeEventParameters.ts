import type { TypedMessage } from '@masknet/typed-message';
import { compact } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_POLL_SOURCES } from '@/constants/index.js';
import type { SupportedMetaKeys } from '@/constants/rp.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getRpMetadata } from '@/helpers/rpPayload.js';
import type { ComposeEventParameters } from '@/providers/types/Telemetry.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import type { CompositePost } from '@/store/useComposeStore.js';

export interface Options {
    draftId?: string;
    scheduleId?: string;
    thread?: CompositePost[];
    failedAt?: SocialSource[];
    availableSources?: SocialSource[];
    isCrossQuote?: boolean;
}

export function getComposeEventParameters(
    post: CompositePost,
    { draftId, scheduleId, thread = [post], availableSources = [], isCrossQuote = false }: Options = {},
): Omit<ComposeEventParameters, 'firefly_account_id'> {
    const lensProfile = getProfileFromStorage(Source.Lens);
    const farcasterProfile = getProfileFromStorage(Source.Farcaster);
    const xProfile = getProfileFromStorage(Source.Twitter);
    const bskyProfile = getProfileFromStorage(Source.Bsky);

    const hasLens = availableSources.includes(Source.Lens);
    const hasFarcaster = availableSources.includes(Source.Farcaster);
    const hasX = availableSources.includes(Source.Twitter);
    const hasBsky = availableSources.includes(Source.Bsky);

    // schedule time indicates that the post is scheduled
    // but only schedule id indicates that the post is scheduled and saved
    const scheduleTime = useComposeScheduleStateStore.getState().scheduleTime;

    const rp = post.typedMessage?.meta ? getRpMetadata(post.typedMessage as TypedMessage<SupportedMetaKeys>) : null;

    return {
        include_lens_post: hasLens,
        lens_id: lensProfile?.profileId,
        lens_handle: lensProfile?.handle,
        lens_post_ids: hasLens ? compact(thread?.map((p) => p.postId[Source.Lens] ?? undefined)) : [],

        include_farcaster_cast: hasFarcaster,
        farcaster_id: farcasterProfile?.profileId,
        farcaster_handle: farcasterProfile?.handle,
        farcaster_cast_ids: hasFarcaster ? compact(thread?.map((p) => p.postId[Source.Farcaster] ?? undefined)) : [],

        include_x_post: hasX,
        x_id: xProfile?.profileId,
        x_handle: xProfile?.handle,
        x_post_ids: hasX ? compact(thread?.map((p) => p.postId[Source.Twitter] ?? undefined)) : [],

        include_bsky_post: hasBsky,
        bsky_id: bskyProfile?.profileId,
        bsky_handle: bskyProfile?.handle,
        bsky_post_ids: hasBsky ? compact(thread?.map((p) => p.postId[Source.Bsky] ?? undefined)) : [],

        is_thread: !!thread?.length && thread.length > 1,

        is_cross_quote: isCrossQuote,

        is_draft: !!draftId,
        draft_id: draftId,

        is_scheduled: !!scheduleId || !!scheduleTime,
        schedule_id: scheduleId,

        include_lucky_drop: !!post.rpPayload,
        lucky_drop_ids: rp?.rpid ? [rp.rpid] : [],

        include_poll: !!(post.poll && Object.values(post.poll?.pollIds).some((id) => !!id)),
        poll_id: SORTED_POLL_SOURCES.map((x) => post.poll?.pollIds[x]).find((x) => !!x) ?? undefined,

        include_farcaster_poll: !!post.poll?.pollIds[Source.Farcaster],
        farcaster_poll_id: post.poll?.pollIds[Source.Farcaster] ?? undefined,

        include_lens_poll: !!post.poll?.pollIds[Source.Lens],
        lens_poll_id: post.poll?.pollIds[Source.Lens] ?? undefined,

        include_x_poll: !!post.poll?.pollIds[Source.Twitter],
        x_poll_id: post.poll?.pollIds[Source.Twitter] ?? undefined,

        include_image: post.images.length > 0,
        include_video: post.videos.length > 0,
    };
}
