import { SORTED_SOCIAL_SOURCES, SUPPORTED_FRAME_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { NODE_ENV, Source } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { t } from '@lingui/core/macro';
import { produce } from 'immer';
import { compact, difference, first } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { LensClubGatedError, SessionExpiredError } from '@/constants/error.js';
import { closeSnackbar } from '@/controllers/openSnackbar.js';
import { canQuotePost } from '@/helpers/canQuotePost.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyCommentPost } from '@/helpers/createDummyPost.js';
import {
    enqueueErrorsMessage,
    enqueueSuccessMessage,
    enqueueWarningMessage,
    MessageKey,
} from '@/helpers/enqueueMessage.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getDetailedErrorMessage } from '@/helpers/getDetailedErrorMessage.js';
import { getPostFailedAt } from '@/helpers/getPostFailedAt.js';
import { resolveClubGatedMessage } from '@/helpers/resolveClubGatedMessage.js';
import { resolvePostTo } from '@/helpers/resolvePostTo.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { resolveSourceName, resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { logger } from '@/libs/Logger.js';
import { commitPoll } from '@/providers/firefly/poll/commitPoll.js';
import { updateClaimStrategy } from '@/providers/firefly/red-packet/updateClaimStrategy.js';
import { captureComposeEvent } from '@/providers/telemetry/captureComposeEvent.js';
import { captureCreatePollEvent } from '@/providers/telemetry/capturePollEvent.js';
import type { PostOn } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { reportCrossedPost } from '@/services/reportCrossedPost.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { ComposeType, CompositePost } from '@/types/compose.js';

async function refreshProfileFeed(source: SocialSource) {
    const currentProfile = getCurrentProfileFromStorage(source);

    await queryClient.invalidateQueries({
        queryKey: ['posts', source, 'posts-of', currentProfile?.profileId],
    });
    await queryClient.refetchQueries({
        queryKey: ['posts', source, 'posts-of', currentProfile?.profileId],
        stale: true,
        type: 'active',
    });
}

/**
 * Invalidate the Orb (LPT-1) Lens comment queries so a freshly published Orb
 * comment appears in the event Comments tab and the World Cup feed without a
 * manual reload. Prefix-matched (no eventSlug) so the active list refetches.
 */
async function refreshOrbCommentQueries() {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts', Source.Lens, 'orb-comments'] }),
        queryClient.invalidateQueries({ queryKey: ['posts', Source.Lens, 'orb-timeline'] }),
    ]);
}

async function updateRpClaimStrategy(compositePost: CompositePost) {
    const { postId, rpPayload } = compositePost;
    if (envs.shared.NODE_ENV === NODE_ENV.Development) {
        if (rpPayload?.publicKey && !SORTED_SOCIAL_SOURCES.some((x) => postId[x])) {
            logger.error("[cross post] No any post id for updating RedPacket's claim strategy.");
        }
    }

    if (SORTED_SOCIAL_SOURCES.some((x) => postId[x]) && rpPayload) {
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
                const currentProfile = getCurrentProfileFromStorage(x);
                return postId[x] && currentProfile
                    ? {
                          platformId: currentProfile.profileId,
                          platformName: resolveRedPacketPlatformType(x),
                      }
                    : null;
            }),
        );
        const postOn: PostOn[] = compact(
            SORTED_SOCIAL_SOURCES.map((x) => {
                const currentProfile = getCurrentProfileFromStorage(x);
                return postId[x] && currentProfile
                    ? {
                          platform: resolveRedPacketPlatformType(x),
                          postId: postId[x]!,
                          handle: currentProfile.handle,
                      }
                    : null;
            }),
        );

        await updateClaimStrategy(rpPayload.metadata.rpid, reactions, claimPlatforms, postOn, rpPayload.publicKey);
    }
}

async function setQueryDataForComment(post: CompositePost, updatedPost: CompositePost) {
    const source = post.availableSources[0];

    const parentPost = post.parentPost[source];
    if (!parentPost) return;

    /**
     * we use mock post to update the comments list optimistically
     * because the real comment data may not be available immediately after posting
     * so we don't refresh the comments list from server here, but invalidate the query to mark it as stale
     */
    const mockPost = createDummyCommentPost(source, updatedPost);
    const queryKey = ['posts', source, 'comments', parentPost.postId];
    // Orb nested replies use a distinct query key from the generic comments list.
    const orbRepliesQueryKey = ['posts', Source.Lens, 'orb-replies', parentPost.postId];

    if (mockPost) {
        const prependMock = (data: { pages: Array<{ data: Post[] }> } | undefined) => {
            if (!data?.pages.length) return data;
            return produce(data, (draft) => {
                draft.pages[0].data.unshift(mockPost);
            });
        };
        queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>({ queryKey }, prependMock);
        if (source === Source.Lens) {
            queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>(
                { queryKey: orbRepliesQueryKey },
                prependMock,
            );
        }
    }
    queryClient.invalidateQueries({ queryKey, refetchType: 'none' });

    if (source === Source.Lens) {
        // Bump the parent's declared comment count in the Orb comment / reply lists so
        // the collapsed "View N replies" toggle stays accurate, and refresh the reply
        // list so a freshly posted reply appears without a manual reload.
        const bumpParentCommentCount = (data: { pages: Array<{ data: Post[] }> } | undefined) => {
            if (!data?.pages.length) return data;
            return produce(data, (draft) => {
                for (const page of draft.pages) {
                    const found = page.data.find((p) => p.postId === parentPost.postId);
                    if (!found) continue;
                    found.stats = {
                        comments: (found.stats?.comments || 0) + 1,
                        mirrors: found.stats?.mirrors || 0,
                        reactions: found.stats?.reactions || 0,
                        quotes: found.stats?.quotes,
                        bookmarks: found.stats?.bookmarks,
                        countOpenActions: found.stats?.countOpenActions,
                        views: found.stats?.views,
                    };
                }
            });
        };
        queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>(
            { queryKey: ['posts', Source.Lens, 'orb-comments'] },
            bumpParentCommentCount,
        );
        queryClient.setQueriesData<{ pages: Array<{ data: Post[] }> }>(
            { queryKey: ['posts', Source.Lens, 'orb-replies'] },
            bumpParentCommentCount,
        );
        await queryClient.invalidateQueries({ queryKey: orbRepliesQueryKey });
    }
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
    queryClient.setQueryData(
        [parentPost.source, 'post-detail', parentPost.postId],
        (oldData: typeof patched | undefined) => {
            if (!oldData) return patched;
            return produce(oldData, (draft) => {
                draft.hasQuoted = true;
                draft.stats = {
                    ...draft.stats!,
                    quotes: (draft.stats?.quotes || 0) + 1,
                };
            });
        },
    );
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
        pollId = await commitPoll(poll, readChars({ chars: compositePost.chars }));

        updatePollId(pollId);
    }

    const parentPost = Object.values(compositePost.parentPost).find((x) => x);

    closeSnackbar({ key: MessageKey.COMPOSE_ERROR_NOTIFICATION_KEY });
    closeSnackbar({ key: MessageKey.COMPOSE_CLUB_GATED_NOTIFICATION_KEY });
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

                const shouldFixType =
                    type === 'quote' && !!parentPost && (parentPost.source !== source || !canQuotePost(parentPost));
                const result = await resolvePostTo(source)({
                    type: shouldFixType ? 'compose' : type,
                    compositePost: {
                        ...compositePost,
                        chars: updatedCompositePost.chars,
                        poll: updatedCompositePost.poll,
                    },
                    keepPostLinks: shouldFixType && !canQuotePost(parentPost),
                    signal,
                });
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
            // Partition this invocation's failures once: club-gated (Lens group
            // gate) gets the same "Join now" warning as the reply-restriction
            // hint, on its own key (distinct from COMPOSE_ERROR_NOTIFICATION_KEY
            // so a future dedup change to one snackbar type can't clobber the
            // other), instead of being folded into the generic error toast
            // (FW-7874). Built from `allErrors` (fresh from this call) rather
            // than the persisted `postError` store, since a source skipped this
            // attempt (e.g. no parent post) would otherwise keep showing a stale
            // error from an earlier attempt.
            const failures = compact(
                SORTED_SOCIAL_SOURCES.map((source, i) => {
                    const error = allErrors[i];
                    if (!error || error instanceof SessionExpiredError) return null;
                    return { source, error };
                }),
            );
            const clubGatedFailure = failures.find(
                (x): x is { source: SocialSource; error: LensClubGatedError } => x.error instanceof LensClubGatedError,
            );
            if (clubGatedFailure) {
                enqueueWarningMessage(resolveClubGatedMessage(clubGatedFailure.error.clubAddress), {
                    key: MessageKey.COMPOSE_CLUB_GATED_NOTIFICATION_KEY,
                });
            }

            const remainingFailures = failures.filter((x) => !(x.error instanceof LensClubGatedError));
            if (remainingFailures.length) {
                enqueueErrorsMessage(
                    t`Your post failed to send to ${resolveSourcesName(
                        remainingFailures.map((x) => x.source),
                        '/',
                    )}. Click 'Retry' to attempt posting again.`,
                    {
                        errors: remainingFailures.map((x) => x.error),
                        key: MessageKey.COMPOSE_ERROR_NOTIFICATION_KEY,
                        persist: true,
                    },
                );
            }
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
            logger.error(`[cross post]: failed to refresh profile feed: ${error}`);
        }
    }

    // update red packet claim strategy
    try {
        await updateRpClaimStrategy(updatedCompositePost);
    } catch (error) {
        logger.error(`[cross post]: failed to update red packet claim strategy: ${error}`);
    }

    try {
        if (type === 'reply') await setQueryDataForComment(compositePost, updatedCompositePost);
        if (type === 'quote') await setQueryDataForQuote(compositePost);
    } catch (error) {
        logger.error(`[cross post]: failed to set query data: ${error}`);
    }

    // refresh Orb (LPT-1) comment lists so the new comment shows without a manual reload
    try {
        if (updatedCompositePost.lpt1Tags?.length) await refreshOrbCommentQueries();
    } catch (error) {
        logger.error(`[cross post]: failed to refresh Orb comment queries: ${error}`);
    }

    return updatedCompositePost;
}
