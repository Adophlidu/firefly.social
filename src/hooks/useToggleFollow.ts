import { t } from '@lingui/core/macro';
import { useIsMutating, useMutation } from '@tanstack/react-query';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { checkFarcasterInvalidSignerKey } from '@/providers/farcaster/checkFarcasterInvalidSignerKey.js';
import { captureProfileActionEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function useToggleFollow(profile: Profile) {
    const { source } = profile;
    const isLogin = useIsLogin(source);
    const mutationKey = ['toggle-follow', source, profile.profileId];
    const isMutating = useIsMutating({ mutationKey, exact: true }) > 0;

    const mutation = useMutation({
        mutationKey,
        mutationFn: async () => {
            if (!profile.profileId) return;

            if (!isLogin) {
                openLoginModal({ source });
                return;
            }

            const following = !!profile.viewerContext?.following;
            const sourceName = resolveSourceName(profile.source);

            try {
                const provider = resolveSocialMediaProvider(source);
                const result = following
                    ? await provider.unfollow(profile.profileId)
                    : await provider.follow(profile.profileId);
                if (profile.protected && !following) {
                    enqueueSuccessMessage(
                        t`A follow request has been sent to @${profile.handle} and is pending their approval.`,
                    );
                } else {
                    enqueueSuccessMessage(
                        following
                            ? t`Unfollowed @${profile.handle} on ${sourceName}`
                            : t`Followed @${profile.handle} on ${sourceName}`,
                    );
                }
                captureProfileActionEvent(following ? 'unfollow' : 'follow', profile);
                return result;
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    following
                        ? t`Failed to unfollow @${profile.handle} on ${sourceName}.`
                        : t`Failed to follow @${profile.handle} on ${sourceName}.`,
                );

                checkFarcasterInvalidSignerKey(error);

                throw error;
            }
        },
    });
    return [isMutating, mutation] as const;
}
