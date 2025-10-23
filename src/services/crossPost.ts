import { t } from '@lingui/core/macro';
import { produce } from 'immer';
import { compact, difference, first } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { NODE_ENV, type SocialSource, Source } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SORTED_SOCIAL_SOURCES, SUPPORTED_FRAME_SOURCES } from '@/constants/index.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyCommentPost } from '@/helpers/createDummyPost.js';
import { enqueueErrorsMessage, enqueueSuccessMessage, MessageKey } from '@/helpers/enqueueMessage.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getDetailedErrorMessage } from '@/helpers/getDetailedErrorMessage.js';
import { getPostFailedAt } from '@/helpers/getPostFailedAt.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { resolvePostTo } from '@/helpers/resolvePostTo.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { resolveSourceName, resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { SnackbarRef } from '@/modals/Snackbar.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import { captureComposeEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { captureCreatePollEvent } from '@/providers/telemetry/capturePollEvent.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { commitPoll } from '@/services/poll.js';
import { reportCrossedPost } from '@/services/reportCrossedPost.js';
import { type CompositePost, useComposeStateStore } from '@/store/useComposeStore.js';
import type { ComposeType } from '@/types/compose.js';

async function refreshProfileFeed(source: SocialSource) {
    const currentProfile = getProfileFromStorage(source);

    await queryClient.invalidateQueries({
        queryKey: ['posts', source, 'posts-of', currentProfile?.profileId],
    });
    await queryClient.refetchQueries({
        queryKey: ['posts', source, 'posts-of', currentProfile?.profileId],
        stale: true,
        type: 'active',
    });
}

async function updateRpClaimStrategy(compositePost: CompositePost) {
    const { postId, rpPayload } = compositePost;
    if (env.shared.NODE_ENV === NODE_ENV.Development) {
        if (rpPayload?.publicKey && !SORTED_SOCIAL_SOURCES.some((x) => postId[x])) {
            console.error("[cross post] No any post id for updating RedPacket's claim strategy.");
        }
    }

    if (SORTED_SOCIAL_SOURCES.some((x) => postId[x]) && rpPayload?.publicKey) {
        const reactions = compact(
            SORTED_SOCIAL_SOURCES.map((x) => {
                const id = postId[x];
                return id
                    ? {
                          platform: resolveRedPacketPlatformType(x),
                          postId: id,
                      }
                    : null;
            }),
        );

        const claimPlatforms = compact(
            SORTED_SOCIAL_SOURCES.map((x) => {
                const currentProfile = getProfileFromStorage(x);
                return postId[x] && currentProfile
                    ? {
                          platformId: currentProfile.profileId,
                          platformName: resolveRedPacketPlatformType(x),
                      }
                    : null;
            }),
        );
        const postOn: FireflyRedPacketAPI.PostOn[] = compact(
            SORTED_SOCIAL_SOURCES.map((x) => {
                const currentProfile = getProfileFromStorage(x);
                return postId[x] && currentProfile
                    ? {
                          platform: resolveRedPacketPlatformType(x),
                          postId: postId[x]!,
                          handle: currentProfile.handle,
                      }
                    : null;
            }),
        );

        await FireflyRedPacketEndpoint.updateClaimStrategy(
            rpPayload.metadata.rpid,
            reactions,
            claimPlatforms,
            postOn,
            rpPayload.publicKey,
        );
    }
}

async function setQueryDataForComment(post: CompositePost, updatedPost: CompositePost) {
    const source = post.availableSources[0];

    const parentPost = post.parentPost[source];
    if (!parentPost) return;

    const mockPost = createDummyCommentPost(source, updatedPost);
    const queryKey = ['posts', source, 'comments', parentPost.postId];

    if (mockPost) {
        queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>({ queryKey }, (data) => {
            if (!data?.pages.length) return data;
            return produce(data, (draft) => {
                draft.pages[0].data.unshift(mockPost);
            });
        });
    }
    if (![Source.Twitter].includes(source)) await queryClient.refetchQueries({ queryKey });
}

async function setQueryDataForQuote(post: CompositePost) {
    const source = post.availableSources[0];

    const parentPost = post.parentPost[source];
    if (!parentPost) return;

    const patched = produce(parentPost, (draft) => {
        draft.hasQuoted = true;
        draft.stats = {
            ...draft.stats!,
            quotes: (draft.stats?.quotes || 0) + 1,
        };
    });
    await queryClient.setQueryData([parentPost.source, 'post-detail', parentPost.postId], patched);
}

interface CrossPostOptions {
    isRetry?: boolean;
    // skip if post is already published
    skipIfPublishedPost?: boolean;
    // skip if no parent post is found in reply or quote
    skipIfNoParentPost?: boolean;
    // If it's a post in thread, only refresh the feeds after sending the last post.
    skipRefreshFeeds?: boolean;
    // skip check published result and showing success or error messages
    skipCheckPublished?: boolean;
    // skip report crossed post
    skipReportCrossedPost?: boolean;
    // abort signal
    signal?: AbortSignal;
}

export async function crossPost(
    type: ComposeType,
    compositePost: CompositePost,
    {
        isRetry = false,
        skipIfPublishedPost = false,
        skipIfNoParentPost = false,
        skipCheckPublished = false,
        skipRefreshFeeds = false,
        skipReportCrossedPost = false,
        signal,
    }: CrossPostOptions = {},
) {
    const { updatePostInThread, updatePollId } = useComposeStateStore.getState();
    const { availableSources, poll } = compositePost;
    let pollId = '';

    // create common poll for farcaster
    if (poll && SUPPORTED_FRAME_SOURCES.some((x) => availableSources.includes(x))) {
        pollId = await commitPoll(poll, readChars(compositePost.chars));

        updatePollId(pollId);
    }

    const parentPost = Object.values(compositePost.parentPost).find((x) => x);

    SnackbarRef.close({ key: MessageKey.COMPOSE_ERROR_NOTIFICATION_KEY });
    const allSettled = await Promise.allSettled(
        SORTED_SOCIAL_SOURCES.map(async (source) => {
            if (!availableSources.includes(source)) return null;

            // post already published
            if (skipIfPublishedPost && compositePost.postId[source]) {
                return null;
            }

            // parent post is required for reply and quote
            if ((type === 'reply' || type === 'quote') && skipIfNoParentPost && !parentPost) {
                return null;
            }

            try {
                const updatedCompositePost = getCompositePost(compositePost.id);
                if (!updatedCompositePost) throw new Error(`Post not found with id: ${compositePost.id}`);

                const result = await resolvePostTo(source)(
                    type === 'quote' && parentPost && parentPost.source !== source ? 'compose' : type,
                    {
                        ...compositePost,
                        chars: updatedCompositePost.chars,
                        poll: updatedCompositePost.poll,
                    },
                    signal,
                );
                updatePostInThread(compositePost.id, (post) => ({
                    ...post,
                    postError: {
                        ...post.postError,
                        [source]: null,
                    },
                }));
                return result;
            } catch (error) {
                updatePostInThread(compositePost.id, (post) => ({
                    ...post,
                    postError: {
                        ...post.postError,
                        [source]: error instanceof Error ? error : new Error(`${error}`),
                    },
                }));
                throw error;
            }
        }),
    );

    const updatedCompositePost = getCompositePost(compositePost.id);
    if (!updatedCompositePost) throw new Error(`Post not found with id: ${compositePost.id}`);

    // check publish result
    if (!skipCheckPublished) {
        // the first error on each platform
        const allErrors = allSettled.map((x) => (x.status === 'rejected' ? x.reason : null));
        const failedAt = getPostFailedAt(updatedCompositePost);

        if (failedAt.length) {
            // show success message if no error found on certain platform
            SORTED_SOCIAL_SOURCES.forEach((x, i) => {
                const settled = allSettled[i];
                const error = settled.status === 'rejected' ? settled.reason : null;
                if (error) return;
                const rootPost = compositePost;
                if (!rootPost.availableSources.includes(x)) return;
                if (!isRetry) {
                    enqueueSuccessMessage(t`Your post was sent to ${resolveSourceName(x)}.`);
                }
            });
            enqueueErrorsMessage(
                t`Your post failed to send to ${resolveSourcesName(failedAt, '/')}. Click 'Retry' to attempt posting again.`,
                {
                    errors: compact(allErrors),
                    key: MessageKey.COMPOSE_ERROR_NOTIFICATION_KEY,
                    persist: true,
                },
            );
        } else {
            if (availableSources.length === 1) {
                const target = first(availableSources);
                enqueueSuccessMessage(t`Your post was sent to ${resolveSourceName(target!)}`);
            } else {
                enqueueSuccessMessage(t`Your post was sent`);
            }
        }

        // report crossed post
        if (!skipReportCrossedPost) {
            reportCrossedPost(updatedCompositePost);

            const availableSources = difference(updatedCompositePost.availableSources, failedAt);
            if (availableSources.length) {
                captureCreatePollEvent(availableSources, updatedCompositePost, pollId);
                captureComposeEvent(type, updatedCompositePost, {
                    failedAt,
                    availableSources,
                });
            }
        }

        if (failedAt.length) {
            throw new Error(
                [
                    `Failed to post on: ${resolveSourcesName(failedAt)}`,
                    ...compact(allErrors).map(getDetailedErrorMessage),
                ].join('\n'),
            );
        }
    }

    // all failed
    if (allSettled.every((x) => x.status === 'rejected')) {
        throw new Error('Post failed to publish.');
    }

    // refresh profile feed
    if (!skipRefreshFeeds) {
        try {
            const staleSources = SORTED_SOCIAL_SOURCES.filter((source, i) => {
                const settled = allSettled[i];
                const postId = settled.status === 'fulfilled' ? settled.value : null;
                return availableSources.includes(source) && postId ? source : null;
            });

            await Promise.allSettled(staleSources.map((source) => refreshProfileFeed(source)));
        } catch (error) {
            console.error(`[cross post]: failed to refresh profile feed: ${error}`);
        }
    }

    // update red packet claim strategy
    try {
        await updateRpClaimStrategy(updatedCompositePost);
    } catch (error) {
        console.error(`[cross post]: failed to update red packet claim strategy: ${error}`);
    }

    // set query data
    try {
        if (type === 'reply') await setQueryDataForComment(compositePost, updatedCompositePost);
        if (type === 'quote') await setQueryDataForQuote(compositePost);
    } catch (error) {
        console.error(`[cross post]: failed to set query data: ${error}`);
    }

    return updatedCompositePost;
}
