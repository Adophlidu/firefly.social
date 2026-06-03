import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { checkFarcasterInvalidSignerKey } from '@/providers/farcaster/checkFarcasterInvalidSignerKey.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useMirror(post: Post) {
    const { postId, source, hasMirrored } = post;
    const isLogin = useIsLogin(source);

    return useAsyncFn(
        async (unmirror?: boolean) => {
            if (!postId) return;
            if (!isLogin) {
                openLoginModalWithGuard({ source });
                return;
            }

            const mirrorOrUnmirror = async () => {
                switch (source) {
                    case Source.Farcaster: {
                        await (hasMirrored
                            ? farcasterSocialMediaProvider.unmirrorPost(postId, Number(post.author.profileId))
                            : farcasterSocialMediaProvider.mirrorPost(postId, Number(post.author.profileId)));
                        enqueueSuccessMessage(hasMirrored ? t`Cancel recast successfully` : t`Recasted`);
                        return;
                    }
                    case Source.Lens: {
                        await (unmirror
                            ? lensSocialMediaProvider.unmirrorPost(post.publicationId)
                            : lensSocialMediaProvider.mirrorPost(postId));
                        enqueueSuccessMessage(unmirror ? t`Cancel repost successfully` : t`Reposted`);
                        return;
                    }
                    case Source.Twitter: {
                        await (hasMirrored
                            ? twitterSocialMediaProxy.unmirrorPost(postId)
                            : twitterSocialMediaProxy.mirrorPost(postId));
                        enqueueSuccessMessage(hasMirrored ? t`Cancel repost successfully` : t`Reposted`);
                        return;
                    }
                    case Source.Bsky: {
                        await (hasMirrored
                            ? bskySocialMediaProvider.unmirrorPost(postId)
                            : bskySocialMediaProvider.mirrorPost(postId));
                        enqueueSuccessMessage(hasMirrored ? t`Cancel repost successfully` : t`Reposted`);
                        return;
                    }
                    default:
                        safeUnreachable(source);
                        return;
                }
            };

            try {
                await mirrorOrUnmirror();

                capturePostActionEvent(hasMirrored ? 'undo_repost' : 'repost', post);
            } catch (error) {
                switch (source) {
                    case Source.Farcaster:
                        enqueueMessageFromError(error, t`Failed to recast.`);
                        break;
                    case Source.Lens:
                    case Source.Twitter:
                    case Source.Bsky:
                        enqueueMessageFromError(error, t`Failed to repost.`);
                        break;
                    default:
                        safeUnreachable(source);
                        break;
                }

                checkFarcasterInvalidSignerKey(error);

                throw error;
            }
        },
        [postId, source, hasMirrored, post, isLogin],
    );
}
