import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { compact, first, last, values } from 'lodash-es';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { CharTag, DraftPostType, FileMimeType, type SocialSource } from '@/constants/enum.js';
import { DEFAULT_THEME_ID } from '@/constants/rp.js';
import { RP_HASH_TAG, SITE_URL } from '@/constants/static.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { toFixed } from '@/helpers/number.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { getHistoryDataById } from '@/providers/firefly/red-packet/getHistoryDataById.js';
import { getMaskTypedMessage } from '@/providers/firefly/red-packet/getMaskTypedMessage.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import type { Post, Profile } from '@/providers/types/SocialMedia.js';
import { type Draft, useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { createInitPostState, useComposeStateStore } from '@/store/useComposeStore.js';
import { type ComposeType, type CompositePost, MediaSource } from '@/types/compose.js';

interface Options {
    draft: Draft;
    draftPost: CompositePost;
    full: boolean;
    availableProfiles: Profile[];
}

async function recoverCompositePost({ draft, draftPost, full, availableProfiles }: Options): Promise<CompositePost> {
    const post: CompositePost = {
        ...draftPost,
        ...(full
            ? {
                  postId: createInitPostState(),
                  postError: createInitPostState(),
                  parentPost: createInitPostState(),
              }
            : {}),
        availableSources: availableProfiles.map((x) => x.source as SocialSource),
        images: draftPost.images.map((image) => ({
            ...image,
            urls: {
                ...image.urls,
                [MediaSource.Local]: URL.createObjectURL(image.file),
            },
        })),
    };

    const rpid = draftPost.rpPayload?.metadata?.rpid;
    if (draft.draftType === DraftPostType.Cloud && rpid) {
        const rpDetail = await runInSafeAsync(() => getHistoryDataById(rpid));
        if (!rpDetail || rpDetail.redpacket_status !== FireflyRedPacketAPI.RedPacketStatus.Send) {
            post.rpPayload = null;
            return post;
        }

        const coverBlob = await runInSafeAsync(async () => {
            const { coverImageUrl } = await getMaskTypedMessage(rpid);
            return fetchImageAsPNG(coverImageUrl, true);
        });
        if (!coverBlob) {
            post.rpPayload = null;
            return post;
        }

        const payloadImageUrl = urlcat(SITE_URL, '/api/rp', {
            'theme-id': rpDetail.theme_id || DEFAULT_THEME_ID,
            usage: 'payload',
            from: formatSenderName(rpDetail.share_from || ''),
            amount: toFixed(rpDetail.total_amounts || '0'),
            type: 'fungible',
            symbol: rpDetail.token_symbol,
            decimals: rpDetail.token_decimal,
            message: rpDetail.rp_msg || t`Hope this sparks a smile.`,
        });
        post.rpPayload = {
            payloadImage: payloadImageUrl,
            claimRequirements: rpDetail.claim_strategy,
            metadata: {
                rpid,
                contract_address: '',
                contract_version: 0,
                creation_time: rpDetail.create_time,
                duration: rpDetail.duration || 0,
                is_random: false,
                network: '',
                password: '',
                sender: { address: '', name: rpDetail.share_from, message: rpDetail.rp_msg },
                shares: Number(rpDetail.total_numbers || '0'),
                token: {
                    decimals: rpDetail.token_decimal,
                    symbol: rpDetail.token_symbol,
                    address: '',
                    chainId: rpDetail.chain_id,
                },
                total: rpDetail.total_amounts || '0',
            },
        };
        post.images = [
            createLocalMediaObject(new File([coverBlob], 'image.png', { type: FileMimeType.PNG }), true),
            ...post.images,
        ];

        // recover rp tag
        let postChars = Array.isArray(post.chars) ? post.chars : [post.chars];
        const firstChar = first(postChars);
        if (firstChar && typeof firstChar === 'string' && firstChar.startsWith(`${RP_HASH_TAG}\n`)) {
            const otherStr = firstChar.replace(`${RP_HASH_TAG}\n`, '');
            postChars = [
                {
                    tag: CharTag.FIREFLY_RP,
                    content: RP_HASH_TAG,
                    visible: false,
                },
                otherStr,
                ...postChars.slice(1),
            ];
        }
        const lastChar = last(postChars);
        const origin = location.origin;
        if (lastChar && typeof lastChar === 'string' && availableProfiles.length) {
            const profileLinkRegex = new RegExp(`\\n ${origin}/profile/(lens|farcaster|x|bsky)/([a-zA-Z0-9.-_]+)$`);
            if (profileLinkRegex.test(lastChar)) {
                const preferSource = SORTED_SOCIAL_SOURCES.find((source) =>
                    availableProfiles.some((profile) => profile.source === source),
                );
                const preferProfile = availableProfiles.find((profile) => profile.source === preferSource);
                const preferProfileLink = preferProfile ? urlcat(origin, getProfileUrl(preferProfile)) : '';
                if (preferProfileLink) {
                    postChars = [
                        ...postChars.slice(0, -1),
                        lastChar.replace(profileLinkRegex, ''),
                        {
                            tag: CharTag.PROMOTE_LINK,
                            content: preferProfileLink,
                            visible: false,
                            sortNo: 5,
                        },
                    ];
                }
            }
        }

        post.chars = postChars;
    }

    return post;
}

export function useApplyDraftPost() {
    const profiles = useCurrentProfiles();

    const { updateChars, apply, focused } = useComposeStateStore();
    const { updateScheduleTime } = useComposeScheduleStateStore();
    const setEditorContent = useSetEditorContent();

    return useAsyncFn(
        async (oldDraft: Draft, full = false) => {
            const draft = { ...oldDraft };

            try {
                if (draft.type === 'reply' || draft.type === 'quote') {
                    const target = first(draft.posts);
                    const post = first(compact(values(target?.parentPost)));
                    if (!target || !post) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied not found</Trans>);
                        return;
                    }

                    const provider = resolveSocialMediaProvider(post.source);
                    const detail = await runInSafeAsync(() => provider.getPostById(post.postId));
                    if (!detail) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied not found</Trans>);
                        return;
                    }
                    if (detail.isHidden) {
                        enqueueErrorMessage(<Trans>The post you quoted/replied has already deleted</Trans>);
                        return;
                    }

                    target.parentPost[post.source] = detail;
                }

                const availableProfiles = draft.availableProfiles.filter((x) =>
                    profiles.some((profile) => isSameProfile(profile, x)),
                );
                const availableSource =
                    draft.type !== 'compose' ? draft.sealedSource || first(draft.posts)?.availableSources?.[0] : null;
                const posts = await Promise.all(
                    draft.posts.map((x) =>
                        recoverCompositePost({
                            draft,
                            draftPost: x,
                            full,
                            availableProfiles,
                        }),
                    ),
                );
                apply({
                    ...draft,
                    focused,
                    sealedSource: availableSource || null,
                    posts,
                    currentDraftId: draft.draftId,
                    showMediaAlert: draft.draftType === DraftPostType.Cloud && !!draft.mediaAlert,
                });
                const post = posts.find((x) => x.id === draft.cursor);
                if (post) {
                    updateChars(post.chars, post.id);
                    setEditorContent(post.chars);
                }
                if (draft.scheduleTime && draft.scheduleTime.getTime() > Date.now())
                    updateScheduleTime(draft.scheduleTime);
            } catch (error) {
                enqueueErrorMessage(<Trans>Failed to apply draft post.</Trans>);
                throw error;
            }
        },
        [profiles, focused, setEditorContent, updateChars, updateScheduleTime, apply],
    );
}

export function useApplyTempDraftPost() {
    const isSmall = useIsSmall('max');
    const profiles = useCurrentProfiles();
    const { posts } = useComposeStateStore();
    const { drafts, removeTempDrafts } = useComposeDraftState();
    const [, applyDraftPost] = useApplyDraftPost();

    return useAsyncFn(
        async (type: ComposeType, post?: Post) => {
            if (type !== 'compose' && !post) return;
            if (posts.some((x) => !isEmptyPost(x))) return;

            const tempDraft = drafts.find((draft) => draft.draftType === DraftPostType.LocalTemp);
            if (tempDraft?.type !== type) return;

            const firstPost = first(tempDraft.posts);
            if (
                (type === 'reply' || type === 'quote') &&
                post &&
                firstPost?.parentPost[post.source]?.postId !== post.postId
            )
                return;

            const isDisabled = !tempDraft.availableProfiles.some((x) =>
                profiles.some((profile) => isSameProfile(profile, x)),
            );
            if (isDisabled) return;

            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Unsaved draft found</Trans>,
                content: (
                    <div className="text-medium text-main md:text-base">
                        <Trans>Would you like to restore it?</Trans>
                    </div>
                ),
                enableCloseButton: !isSmall,
                enableCancelButton: true,
                cancelButtonText: <Trans>Discard</Trans>,
                confirmButtonText: <Trans>Yes</Trans>,
                variant: 'normal',
            });
            if (confirmed === null) return;
            if (confirmed === false) {
                removeTempDrafts();
                return;
            }

            await applyDraftPost(tempDraft);
        },
        [drafts, isSmall, profiles, posts, applyDraftPost, removeTempDrafts],
    );
}
