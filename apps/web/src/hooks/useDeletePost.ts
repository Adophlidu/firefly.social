import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import type { SocialSource } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { checkFarcasterInvalidSignerKey } from '@/providers/farcaster/checkFarcasterInvalidSignerKey.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useDeletePost(source: SocialSource) {
    const pathname = usePathname();
    const navBack = useComeBack();

    return useAsyncFn(
        async (post: Post) => {
            try {
                const provider = resolveSocialMediaProvider(source);
                const result = await provider.deletePost(post.postId);
                if (!result) throw new Error(`Failed to delete post: ${post.postId}`);

                if (isRoutePathname(pathname, '/post') && post.type === 'Post') {
                    navBack();
                }
                capturePostActionEvent('delete', post);
                enqueueSuccessMessage(t`Post was deleted`);
            } catch (error) {
                enqueueMessageFromError(error, t`Failed to delete post.`);
                checkFarcasterInvalidSignerKey(error);
                throw error;
            }
        },
        [source, pathname, navBack],
    );
}
