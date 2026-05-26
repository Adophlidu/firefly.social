import type { SocialSource } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import { runInSafe, runInSafeAsync } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { compact, uniqBy } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { getFifaCampAvatarFromInfo } from '@/helpers/isFifaCampAvatarEligible.js';
import { isWorldCupEnabled } from '@/helpers/isWorldCupEnabled.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { checkFifaCampAccounts } from '@/providers/firefly/endpoint/checkFifaCampAccounts.js';
import type { FifaCampAccountInfo } from '@/providers/types/Firefly.js';
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
    ogRecord: FifaCampAccountInfo | null,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    if (idAndHandleList.find((item) => item.id === author.profileId && item.handle === author.handle)) {
        runInSafe(() => {
            queryClient.setQueryData(
                ['fifa-camp-status', 'v2', author.source, author.profileId, author.handle],
                ogRecord || null,
            );
        });
    }
}

function fillFifaCampStatus(
    post: Post,
    records: FifaCampAccountInfo[],
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    const author = post.author;
    const platform = resolveSourceInUrlForApi(author.source);
    const ogRecord = records.find(
        (r) => r.platform === platform && isSameProfileId(platform, r.platform_id, author.profileId),
    );

    updateQueryDataAsync(author, ogRecord || null, idAndHandleList);

    const campAvatar = getFifaCampAvatarFromInfo(ogRecord);
    if (!campAvatar) {
        return post;
    }

    return {
        ...post,
        author: {
            ...post.author,
            fifaCampCountryCode: campAvatar.countryCode,
            fifaCampCountryLogo: campAvatar.flagUrl,
        },
    };
}

async function fillAuthorFifaCampStatusForPosts(posts: Post[], source: SocialSource) {
    if (!isWorldCupEnabled()) return;

    const idAndHandleList = uniqBy(
        posts
            .flatMap((p) => {
                return compact([p, p.root, p.commentOn, ...(p.comments || []), p.quoteOn]);
            })
            .map((p) => ({ id: p.author.profileId, handle: p.author.handle })),
        ({ id, handle }) => `${id}-${handle}`,
    );
    if (!idAndHandleList.length) return;

    const infoList = await runInSafeAsync(() => checkFifaCampAccounts(source, idAndHandleList));
    if (!infoList) return;

    const infoRecord = compact(infoList);

    posts.forEach((post) => {
        const newPost = fillFifaCampStatus(post, infoRecord, idAndHandleList);
        if (newPost.root) {
            fillFifaCampStatus(newPost.root, infoRecord, idAndHandleList);
        }
        if (newPost.commentOn) {
            fillFifaCampStatus(newPost.commentOn, infoRecord, idAndHandleList);
        }
        if (newPost.comments?.length) {
            newPost.comments.forEach((p) => fillFifaCampStatus(p, infoRecord, idAndHandleList));
        }
        if (newPost.quoteOn) {
            fillFifaCampStatus(newPost.quoteOn, infoRecord, idAndHandleList);
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

export function AddAuthorFifaCampStatusForPosts(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as Provider[K];
            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<Provider[K]>) => {
                    const m = method as unknown as (...args: Parameters<Provider[K]>) => ReturnType<Provider[K]>;
                    const result = await m.call(target.prototype, ...args);

                    if (result.data?.length) {
                        runInSafeAsync(() => fillAuthorFifaCampStatusForPosts(result.data, source));
                    }

                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}
