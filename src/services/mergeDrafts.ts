import { safeUnreachable } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { compact, first, orderBy } from 'lodash-es';

import { DraftPostType, Source } from '@/constants/enum.js';
import { POLL_CHOICE_TYPE, POLL_STRATEGIES } from '@/constants/poll.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import { recoverCharsByMentions } from '@/helpers/recoverCharsByMentions.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { type CloudDraft, CloudDraftType } from '@/providers/types/CloudDraft.js';
import { ProfileStatus } from '@/providers/types/SocialMedia.js';
import type { Draft } from '@/store/useComposeDraftStore.js';
import { createInitSinglePostState } from '@/store/useComposeStore.js';
import type { ComposeType, CompositePost, OrphanPost } from '@/types/compose.js';

function resolveComposeType(type?: CloudDraftType): ComposeType | null {
    if (!type) return null;

    switch (type) {
        case CloudDraftType.MainPost:
        case CloudDraftType.FarcasterComposeIntent:
            return 'compose';
        case CloudDraftType.FarcasterComment:
        case CloudDraftType.LensComment:
        case CloudDraftType.TwitterComment:
            return 'reply';
        case CloudDraftType.FarcasterQuote:
        case CloudDraftType.LensQuote:
        case CloudDraftType.TwitterQuote:
            return 'quote';
        default:
            safeUnreachable(type);
            return null;
    }
}

function resolvePollDuration(seconds: number) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    return { days, hours, minutes };
}

function formatCloudDraftToLocalDraft(cloudDraft: CloudDraft): Draft | null {
    const { raw_json } = cloudDraft;
    const composeType = resolveComposeType(raw_json.type.type);
    if (!composeType) return null;

    const farcasterChannel = raw_json.farcaster_channel;
    const lensChannel = raw_json.lens_channel;
    const posts = compact(
        raw_json.content.map<CompositePost | null>((content) => {
            const availableSources = raw_json.platform.map((p) => resolveSocialSource(p.platform));
            const source = first(availableSources);
            if (!source) return null;

            const newPost: CompositePost = {
                ...createInitSinglePostState(crypto.randomUUID()),
                chars: recoverCharsByMentions(content.text, content.mentions),
                availableSources,
            };
            if ((composeType === 'quote' || composeType === 'reply') && raw_json.type.id) {
                // For quote and reply, we only set the parent post id and source, other details will be fetched when applying the draft
                newPost.parentPost[source] = {
                    publicationId: raw_json.type.id,
                    source,
                    postId: raw_json.type.id,
                } as OrphanPost;
            }
            if (content.poll) {
                newPost.poll = {
                    duration: resolvePollDuration(content.poll.duration),
                    options: content.poll.options.map((option) => ({
                        id: crypto.randomUUID(),
                        label: option,
                    })),
                    type: POLL_CHOICE_TYPE.Single,
                    strategies: POLL_STRATEGIES.None,
                    pollIds: {
                        [Source.Farcaster]: null,
                        [Source.Lens]: null,
                        [Source.Twitter]: null,
                        [Source.Bsky]: null,
                    },
                };
            }
            if (farcasterChannel) {
                newPost.channel.Farcaster = {
                    id: farcasterChannel.id,
                    source: Source.Farcaster,
                    name: farcasterChannel.name,
                    description: farcasterChannel.description,
                    imageUrl: farcasterChannel.image_url,
                    url: '',
                    parentUrl: '',
                    followerCount: farcasterChannel.follower_count,
                    timestamp: Date.now(),
                };
            }
            if (lensChannel) {
                newPost.channel.Lens = {
                    id: lensChannel.id,
                    source: Source.Lens,
                    name: lensChannel.name,
                    description: lensChannel.description,
                    imageUrl: lensChannel.image_url,
                    url: '',
                    parentUrl: '',
                    followerCount: lensChannel.follower_count,
                    timestamp: Date.now(),
                };
            }
            if (content.rpid) {
                newPost.rpPayload = {
                    payloadImage: '',
                    claimRequirements: [],
                    metadata: {
                        rpid: content.rpid,
                        contract_address: '',
                        contract_version: 0,
                        creation_time: 0,
                        duration: 0,
                        is_random: false,
                        network: '',
                        password: '',
                        sender: { address: '', name: '', message: '' },
                        shares: 0,
                        token: { decimals: 0, symbol: '', address: '', chainId: 0 },
                        total: '',
                    },
                };
            }

            return newPost;
        }),
    );
    if (!posts.length) return null;

    return {
        draftId: cloudDraft.draft_id,
        createdAt: new Date(cloudDraft.created_at),
        availableProfiles: raw_json.platform.map((p) => {
            const source = resolveSocialSource(p.platform);

            return {
                profileId: p.uid,
                profileSource: source,
                source,
                displayName: '',
                handle: '',
                fullHandle: '',
                pfp: '',
                followerCount: 0,
                followingCount: 0,
                verified: true,
                status: ProfileStatus.Active,
            };
        }),
        type: composeType,
        posts,
        cursor: first(posts)?.id || '',
        draftType: DraftPostType.Cloud,
        mediaAlert: raw_json.has_media || raw_json.content.some((c) => c.hasMedia),
        sealedSource: composeType === 'quote' || composeType === 'reply' ? first(first(posts)?.availableSources) : null,
        scheduleTime: raw_json.send_time ? new Date(raw_json.send_time) : undefined,
    };
}

export function mergeDrafts(localDrafts: Draft[], cloudDrafts: Array<Pageable<CloudDraft, PageIndicator>>) {
    const filteredDrafts = localDrafts.filter((draft) => draft.draftType === DraftPostType.LocalNormal);
    if (!first(cloudDrafts)?.data?.length) return filteredDrafts;

    return cloudDrafts
        .map((pageData, i) => {
            if (i === 0) {
                const formattedDrafts = pageData.data.map((cloudDraft) => {
                    const localDraft = filteredDrafts.find((draft) => draft.draftId === cloudDraft.draft_id);
                    if (localDraft) return { ...localDraft, cloudDraftId: cloudDraft.draft_id };

                    return formatCloudDraftToLocalDraft(cloudDraft);
                });

                return orderBy(
                    compact([
                        ...formattedDrafts,
                        ...filteredDrafts.filter(
                            (draft) => !formattedDrafts.some((fd) => fd?.draftId === draft.draftId),
                        ),
                    ]),
                    (x) => {
                        return dayjs(x.createdAt).unix();
                    },
                    'desc',
                );
            }

            return compact(pageData.data.map(formatCloudDraftToLocalDraft));
        })
        .flat();
}
