import { safeUnreachable } from '@dimensiondev/utils';
import { compact, entries, first, isUndefined, values } from 'lodash-es';

import { CharTag, type SocialSource, type SocialSourceInURL, Source } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { getPollDurationSeconds } from '@/helpers/polls.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { logger } from '@/libs/Logger.js';
import { createCloudDraft } from '@/providers/firefly/cloud-draft/createCloudDraft.js';
import {
    type CloudDraftChannel,
    type CloudDraftContent,
    CloudDraftType,
    type CreateCloudDraftRequest,
} from '@/providers/types/CloudDraft.js';
import type { Draft } from '@/store/useComposeDraftStore.js';

function getSourceAndParentPost({ posts }: Draft) {
    const post = first(posts);
    if (!post) return null;

    const source = first(post.availableSources);
    if (!source) return null;

    const parentPost = post.parentPost?.[source];
    if (!parentPost) return null;

    return { source, parentPost };
}

function resolveCloudDraftType(draft: Draft): CreateCloudDraftRequest['type'] | null {
    switch (draft.type) {
        case 'compose':
            return { type: CloudDraftType.MainPost };
        case 'reply': {
            const { source, parentPost } = getSourceAndParentPost(draft) || {};
            if (!source || !parentPost) return null;

            switch (source) {
                case Source.Farcaster:
                    return {
                        type: CloudDraftType.FarcasterComment,
                        id: parentPost.postId,
                        profileId: parentPost.author.profileId,
                    };
                case Source.Lens:
                    return { type: CloudDraftType.LensComment, id: parentPost.postId };
                case Source.Twitter:
                    return { type: CloudDraftType.TwitterComment, id: parentPost.postId };
                case Source.Bsky:
                    return { type: CloudDraftType.BskyComment, id: parentPost.postId };
                default:
                    safeUnreachable(source);
                    return null;
            }
        }
        case 'quote': {
            const { source, parentPost } = getSourceAndParentPost(draft) || {};
            if (!source || !parentPost) return null;

            switch (source) {
                case Source.Farcaster:
                    return {
                        type: CloudDraftType.FarcasterQuote,
                        id: parentPost.postId,
                        profileId: parentPost.author.profileId,
                    };
                case Source.Lens:
                    return { type: CloudDraftType.LensQuote, id: parentPost.postId };
                case Source.Twitter:
                    return { type: CloudDraftType.TwitterQuote, id: parentPost.postId };
                case Source.Bsky:
                    return { type: CloudDraftType.BskyQuote, id: parentPost.postId };
                default:
                    safeUnreachable(source);
                    return null;
            }
        }
        default:
            safeUnreachable(draft.type);
            return null;
    }
}

function resolveChannelData(draft: Draft): {
    farcaster_channel?: CloudDraftChannel;
    lens_channel?: CloudDraftChannel;
} | null {
    const post = first(draft.posts);
    if (!post) return null;

    return ([Source.Farcaster, Source.Lens] as const).reduce<{
        farcaster_channel?: CloudDraftChannel;
        lens_channel?: CloudDraftChannel;
    }>((acc, source) => {
        const channel = post.channel?.[source];
        if (!channel || channel.id === 'home') return acc;

        acc[source === Source.Farcaster ? 'farcaster_channel' : 'lens_channel'] = {
            id: channel.id,
            name: channel.name,
            description: channel.description || '',
            image_url: channel.imageUrl,
            created_at: channel.timestamp,
            follower_count: channel.followerCount,
        };

        return acc;
    }, {});
}

export async function saveLocalDraftToCloud(draft: Draft) {
    const cloudDraftType = resolveCloudDraftType(draft);
    if (!cloudDraftType) {
        logger.warn('Unsupported draft type for cloud saving', draft);
        return;
    }

    const restriction = first(draft.posts)?.restriction;
    const source = draft.availableProfiles.length === 1 ? first(draft.availableProfiles)?.source : undefined;
    return createCloudDraft({
        id: draft.draftId,
        client: 'web',
        last_update_time: draft.createdAt.getTime(),
        type: cloudDraftType,
        platform: draft.availableProfiles.map((profile) => ({
            uid: profile.profileId,
            platform: resolveSocialSourceInUrl(profile.source),
        })),
        content: draft.posts.map<CloudDraftContent>((post) => {
            const draftContent: CloudDraftContent = {
                text: readChars(post.chars, 'both', source),
                hasMedia: !!post.images.length || !!post.videos.length,
                mentions: compact(
                    (Array.isArray(post.chars) ? post.chars : [post.chars]).map((char) => {
                        if (typeof char === 'string' || char.tag !== CharTag.MENTION) return null;

                        return {
                            text: char.content,
                            platform: char.profiles.map((profile) => ({
                                uid: profile.platform_id,
                                platform: resolveSocialSourceInUrl(
                                    resolveSocialSourceFromFireflyPlatform(profile.platform),
                                ),
                                handle: profile.handle,
                            })),
                        };
                    }),
                ),
            };
            if (post.poll) {
                draftContent.poll = {
                    options: post.poll.options.map((option) => option.label || ''),
                    duration: getPollDurationSeconds(post.poll.duration),
                };
            }
            if (post.rpPayload?.metadata?.rpid) {
                draftContent.rpid = post.rpPayload.metadata.rpid;
                if (post.images.length === 1 && first(post.images)?.isRpPayloadImage && !post.videos.length) {
                    draftContent.hasMedia = false;
                }
            }
            if (values(post.postError).some((error) => !!error)) {
                draftContent.postError = entries(post.postError).reduce<Partial<Record<SocialSourceInURL, string>>>(
                    (acc, [source, error]) => {
                        if (error) {
                            acc[resolveSocialSourceInUrl(source as SocialSource)] =
                                (error instanceof Error ? error.message : String(error)) || 'Unknown error';
                        }
                        return acc;
                    },
                    {},
                );
            }

            return draftContent;
        }),
        send_time: draft.scheduleTime?.getTime(),
        reply_settings: restriction,
        twitter_visibility:
            !isUndefined(restriction) && draft.availableProfiles.some((x) => x.source === Source.Twitter)
                ? restriction
                : undefined,
        ...resolveChannelData(draft),
    });
}
