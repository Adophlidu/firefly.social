import { type SocialSource } from '@/constants/enum.js';
import { deletePostFromQueryData } from '@/helpers/deletePostFromQueryData.js';
import type { Post, Provider } from '@/providers/types/SocialMedia.js';
import type { ClassType } from '@/types/utility.js';

export function SetQueryDataForReportPost(source: SocialSource) {
    return function decorator<T extends ClassType<Provider>>(target: T): T {
        const method = target.prototype.reportPost as Provider['reportPost'];

        Object.defineProperty(target.prototype, 'reportPost', {
            value: async (post: Post) => {
                const m = method as (post: Post) => Promise<boolean>;
                const result = await m?.call(target.prototype, post);

                if (post.postId) deletePostFromQueryData(source, post.postId);

                return result;
            },
        });

        return target;
    };
}
