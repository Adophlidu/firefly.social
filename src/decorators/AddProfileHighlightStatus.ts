import { compact, uniqBy } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source, SourceInURL, SparksAccountStatus } from '@/constants/enum.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { runInSafe, runInSafeAsync } from '@/helpers/runInSafe.js';
import { checkGenesisSparksAccounts } from '@/providers/firefly/endpoint/checkGenesisSparksAccounts.js';
import type { SparksAccountInfo } from '@/providers/types/Firefly.js';
import type { Post, Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

function isSameProfileId(platform: SourceInURL, a: string, b: string) {
    if (platform === SourceInURL.Lens) {
        return isSameEthereumAddress(a, b);
    }
    return a === b;
}

function updateQueryDataAsync(
    author: Post['author'],
    ogRecord: SparksAccountInfo | null,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    if (idAndHandleList.find((item) => item.id === author.profileId && item.handle === author.handle)) {
        runInSafe(() => {
            queryClient.setQueryData(
                ['profile-highlight-status', author.source, author.profileId, author.handle],
                ogRecord || null,
            );
        });
    }
}

function fillHighlightStatus(
    post: Post,
    records: SparksAccountInfo[],
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    const author = post.author;
    const platform = resolveSourceInUrlForApi(author.source);
    const ogRecord = records.find(
        (r) => r.platform === platform && isSameProfileId(platform, r.platform_id, author.profileId),
    );

    updateQueryDataAsync(author, ogRecord || null, idAndHandleList);

    if (!ogRecord) {
        return post;
    }

    return {
        ...post,
        author: {
            ...post.author,
            highlighted: (
                compact([
                    SparksAccountStatus.Activated,
                    author.source === Source.Twitter ? SparksAccountStatus.NotActivated : null,
                ]) as SparksAccountStatus[]
            ).includes(ogRecord.status),
        },
    };
}

async function fillAuthorHighlightStatusForPosts(posts: Post[], source: SocialSource) {
    const idAndHandleList = uniqBy(
        posts
            .flatMap((p) => {
                return compact([p, p.root, p.commentOn, ...(p.comments || []), p.quoteOn]);
            })
            .map((p) => ({ id: p.author.profileId, handle: p.author.handle })),
        ({ id, handle }) => `${id}-${handle}`,
    );
    if (!idAndHandleList.length) return;

    const infoList = await runInSafeAsync(() => checkGenesisSparksAccounts(source, idAndHandleList));
    if (!infoList) return;

    const infoRecord = compact(infoList);

    posts.forEach((post) => {
        const newPost = fillHighlightStatus(post, infoRecord, idAndHandleList);
        if (newPost.root) {
            fillHighlightStatus(newPost.root, infoRecord, idAndHandleList);
        }
        if (newPost.commentOn) {
            fillHighlightStatus(newPost.commentOn, infoRecord, idAndHandleList);
        }
        if (newPost.comments?.length) {
            newPost.comments.forEach((p) => fillHighlightStatus(p, infoRecord, idAndHandleList));
        }
        if (newPost.quoteOn) {
            fillHighlightStatus(newPost.quoteOn, infoRecord, idAndHandleList);
        }
    });
}

const METHODS_BE_OVERRIDDEN = [
    'discoverPosts',
    'discoverPostsById',
    'getPostsByProfileId',
    'getMediaPostsByProfileId',
    'getRepliesPostsByProfileId',
] as const;

export function AddAuthorHighlightStatusForPosts(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<Provider[K]>) => {
                    const m = method as unknown as (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const result = await m.call(target.prototype, ...args);

                    if (result.data?.length) {
                        runInSafeAsync(() => fillAuthorHighlightStatusForPosts(result.data, source));
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
