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

    // update query to reduce redundant calls
    if (idAndHandleList.find((item) => item.id === author.profileId && item.handle === author.handle)) {
        runInSafe(() => {
            queryClient.setQueryData(
                ['profile-highlight-status', author.source, author.profileId, author.handle],
                ogRecord || null,
            );
        });
    }

    if (!ogRecord) return post;

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
                return compact([p, p.root, p.commentOn, ...(p.comments || [])]);
            })
            .map((p) => ({ id: p.author.profileId, handle: p.author.handle })),
        ({ id, handle }) => `${id}-${handle}`,
    ).filter(({ id, handle }) => {
        const oldData = runInSafe(() =>
            queryClient.getQueryData<SparksAccountInfo>(['profile-highlight-status', source, id, handle]),
        );
        return oldData === undefined;
    });
    if (!idAndHandleList.length) return posts;

    const records = await runInSafeAsync(() => checkGenesisSparksAccounts(source, idAndHandleList));
    if (!records?.infoList?.length) return posts;

    return posts.map((post) => {
        const newPost = fillHighlightStatus(post, records.infoList, idAndHandleList);
        if (newPost.root) {
            newPost.root = fillHighlightStatus(newPost.root, records.infoList, idAndHandleList);
        }
        if (newPost.commentOn) {
            newPost.commentOn = fillHighlightStatus(newPost.commentOn, records.infoList, idAndHandleList);
        }
        if (newPost.comments?.length) {
            newPost.comments = newPost.comments.map((p) => fillHighlightStatus(p, records.infoList, idAndHandleList));
        }

        return newPost;
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
                        const posts = await fillAuthorHighlightStatusForPosts(result.data, source);
                        result.data = posts;
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
