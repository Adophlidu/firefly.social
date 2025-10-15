import { uniqBy } from 'lodash-es';

import { type SocialSource, SparksAccountStatus } from '@/constants/enum.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Post, Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

async function fillAuthorHighlightStatusForPosts(posts: Post[], source: SocialSource) {
    const records = await runInSafeAsync(() =>
        FireflyEndpointProvider.checkGenesisSparksAccounts(
            source,
            uniqBy(
                posts.map((p) => ({ id: p.author.profileId, handle: p.author.handle })),
                ({ id, handle }) => `${id}-${handle}`,
            ),
        ),
    );
    if (!records?.infoList?.length) return posts;

    const platform = resolveSourceInUrlForApi(source);
    return posts.map((post, i) => {
        const ogRecord = records.infoList.find(
            (r) => r.platform === platform && r.platform_id === post.author.profileId,
        );
        if (!ogRecord) return post;

        return {
            ...post,
            author: {
                ...post.author,
                highlighted: [SparksAccountStatus.Activated, SparksAccountStatus.NotActivated].includes(
                    ogRecord.status,
                ),
            },
        };
    });
}

const METHODS_BE_OVERRIDDEN = [
    'getCommentsById',
    'discoverPosts',
    'discoverPostsById',
    'getPostsByProfileId',
    'getHiddenComments',
    'getMediaPostsByProfileId',
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
