import { Trans } from '@lingui/react/macro';
import { compact, first } from 'lodash-es';
import urlcat from 'urlcat';

import { anonymousHandle } from '@/components/Compose/PostByAnonymous.js';
import { type SocialSource, Source, SourceInURL } from '@/constants/enum.js';
import { NotImplementedError, TimeoutError } from '@/constants/error.js';
import { readChars } from '@/helpers/chars.js';
import { delay } from '@/helpers/delay.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { createS3MediaObject, resolveImageUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { safeUnreachable, unreachable } from '@/helpers/unreachable.js';
import { getFarcasterMediaObjects } from '@/providers/farcaster/getFarcasterMediaObjects.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { uploadAndConvertToM3u8 } from '@/services/uploadAndConvertToM3u8.js';
import { uploadToS3 } from '@/services/uploadToS3.js';
import { type CompositePost, type OrphanPost } from '@/store/useComposeStore.js';
import type { ComposeType } from '@/types/compose.js';

const postByFireflySources: SocialSource[] = [Source.Farcaster, Source.Twitter];

interface CreateAnonymousPostResult {
    source: SocialSource;
    success: boolean;
    postId?: string;
    reason?: string;
}

function getSuccessMessage(type: ComposeType, source: SocialSource) {
    switch (type) {
        case 'compose':
            return <Trans>🎭 Your post was sent to {resolveSourceName(source)}.</Trans>;
        case 'quote':
            return <Trans>🎭 Quoted on {resolveSourceName(source)}.</Trans>;
        case 'reply':
            return <Trans>🎭 Replied on {resolveSourceName(source)}.</Trans>;
        default:
            safeUnreachable(type);
            return null;
    }
}

function getErrorMessage(type: ComposeType, source: SocialSource) {
    switch (type) {
        case 'compose':
            return <Trans>Failed to send your post to {resolveSourceName(source)}.</Trans>;
        case 'quote':
            return <Trans>Failed to quote on {resolveSourceName(source)}.</Trans>;
        case 'reply':
            return <Trans>Failed to reply on {resolveSourceName(source)}.</Trans>;
        default:
            safeUnreachable(type);
            return null;
    }
}

async function waitForTask(id: string, sources: SocialSource[], retryCount = 20): Promise<CreateAnonymousPostResult[]> {
    if (retryCount <= 0) {
        throw new TimeoutError();
    }

    const result = await FireflyEndpointProvider.getAnonymousPostById(id);

    switch (result.status) {
        case 'queued':
        case 'generating_proof':
            await delay(800);
            return waitForTask(id, sources, retryCount - 1);
        case 'sent':
            return sources.map((x) => {
                switch (x) {
                    case Source.Farcaster: {
                        const farcasterCastId = result.cast_hashs.find(
                            (x) => x.community === anonymousHandle[Source.Farcaster],
                        )?.hash;
                        return {
                            source: x,
                            success: !!farcasterCastId,
                            postId: farcasterCastId,
                            reason: 'No post id returned.',
                        };
                    }
                    case Source.Twitter: {
                        const tweetId = result.cast_hashs.find((x) => x.community === 'x')?.tweetId;
                        return { source: x, success: !!tweetId, postId: tweetId, reason: 'No post id returned.' };
                    }
                    case Source.Lens:
                    case Source.Bsky:
                        return { source: x, success: false, reason: 'Unsupported source.' };
                }
            });
        case 'proof_failed':
        case 'failed':
            throw new Error(result.error);
        default:
            unreachable(result.status);
    }
}

function resolvePostReferenceId(post: OrphanPost) {
    switch (post.source) {
        case Source.Farcaster:
        case Source.Lens:
        case Source.Bsky:
            return post.postId;
        case Source.Twitter:
            return urlcat('https://x.com/:handle/status/:postId', {
                handle: post.author.handle,
                postId: post.postId,
            });
        default:
            safeUnreachable(post.source);
            return null;
    }
}

async function createAnonymousPostByFirefly(
    type: ComposeType,
    compositePost: CompositePost,
    sources: SocialSource[],
    signal?: AbortSignal,
): Promise<CreateAnonymousPostResult[]> {
    const { images, videos, chars, parentPost, availableSources } = compositePost;
    const firstSource = first(availableSources);
    const parent = type !== 'compose' && firstSource && availableSources.length === 1 ? parentPost[firstSource] : null;
    if (type !== 'compose' && !parent?.postId) {
        throw new Error('No parent post found.');
    }

    const imageResults = await Promise.all(
        images.map(async (media) => {
            if (resolveImageUrl(Source.Farcaster, media)) return media;
            return createS3MediaObject(await uploadToS3(media.file, SourceInURL.Firefly), media);
        }),
    );
    const videoResults = await Promise.all(
        videos.map(async (media) => {
            return createS3MediaObject(await uploadAndConvertToM3u8(media.file, SourceInURL.Firefly, signal), media);
        }),
    );

    const content = readChars(chars, 'both', Source.Farcaster);
    const mediaObjects = getFarcasterMediaObjects(compositePost, {
        images: imageResults,
        videos: videoResults,
        polls: [],
    });

    const result = await FireflyEndpointProvider.createAnonymousPost({
        text: content,
        embeds: mediaObjects.map((x) => x.url),
        quote: type === 'quote' && parent ? resolvePostReferenceId(parent) : null,
        parent: type === 'reply' && parent ? resolvePostReferenceId(parent) : null,
        channel: null,
        postToTwitter: sources.includes(Source.Twitter),
    });
    if (!result.success) {
        return sources.map((x) => ({
            source: x,
            success: false,
            reason: result.message,
        }));
    }

    return waitForTask(result.post_id, sources);
}

async function createAnonymousPostByPlatform(
    type: ComposeType,
    compositePost: CompositePost,
    sources: SocialSource[],
    signal?: AbortSignal,
): Promise<CreateAnonymousPostResult[]> {
    throw new NotImplementedError();
}

export async function createAnonymousPost(type: ComposeType, compositePost: CompositePost, signal?: AbortSignal) {
    try {
        const { availableSources } = compositePost;
        const [sourcesForFirefly, sourcesForPlatform] = availableSources.reduce<[SocialSource[], SocialSource[]]>(
            (acc, current) => {
                if (postByFireflySources.includes(current)) {
                    acc[0].push(current);
                } else {
                    acc[1].push(current);
                }

                return acc;
            },
            [[], []],
        );

        const result = (
            await Promise.all(
                compact([
                    sourcesForFirefly.length
                        ? createAnonymousPostByFirefly(type, compositePost, sourcesForFirefly, signal)
                        : null,
                    sourcesForPlatform.length
                        ? createAnonymousPostByPlatform(type, compositePost, sourcesForPlatform, signal)
                        : null,
                ]),
            )
        ).flat(1);
        const successfulData = result.filter((x) => x.success);
        const failedData = result.filter((x) => !x.success);

        successfulData.forEach((x) => {
            const message = getSuccessMessage(type, x.source);
            if (message) {
                enqueueSuccessMessage(
                    <p>
                        {message}
                        {x.postId ? (
                            <a href={resolvePostUrl(x.source, x.postId)} className="cursor-pointer underline">
                                <Trans>View</Trans>
                            </a>
                        ) : null}
                    </p>,
                );
            }
        });
        failedData.forEach((x) => {
            const message = getErrorMessage(type, x.source);
            if (message) {
                enqueueErrorMessage(
                    <p>
                        {message}
                        {x.reason ? ` ${x.reason}` : ''}
                    </p>,
                );
            }
        });
    } catch (error) {
        if (error instanceof TimeoutError) {
            enqueueSuccessMessage(
                <Trans>
                    The task is still in progress, you can check on{' '}
                    <a
                        href={RouteResolver.profile({
                            source: Source.Farcaster,
                            handle: anonymousHandle[Source.Farcaster] || 'anoncast',
                        })}
                        className="cursor-pointer underline"
                    >
                        this page
                    </a>{' '}
                    later
                </Trans>,
            );
            return;
        }
        enqueueErrorMessage(<Trans>Failed to create anonymous post</Trans>, { error });
        throw error;
    }
}
