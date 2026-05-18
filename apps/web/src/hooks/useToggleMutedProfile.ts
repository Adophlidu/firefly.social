import type { SocialSource } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { isProfileMuted } from '@/hooks/useIsProfileMuted.js';
import { captureMuteEvent } from '@/providers/telemetry/captureMuteEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

/**
 * Mute and unmute a profile
 */
export function useToggleMutedProfile(source: SocialSource) {
    const isLogin = useIsLogin(source);

    return useAsyncFn(
        async (profile: Profile, overrideMuted?: boolean) => {
            if (!isLogin) {
                openLoginModal({ source: profile.source });
                return false;
            }
            const muted = overrideMuted ?? isProfileMuted(profile);
            const sourceName = resolveSourceName(profile.source);
            try {
                const provider = resolveSocialMediaProvider(profile.source);
                if (muted) {
                    const result = await provider.unblockProfile(profile.profileId);
                    enqueueSuccessMessage(t`Unmuted @${profile.handle} on ${sourceName}.`);
                    captureMuteEvent(EventId.UNMUTE_SUCCESS, profile);
                    return result;
                } else {
                    const result = await provider.blockProfile(profile.profileId);
                    enqueueSuccessMessage(t`Muted @${profile.handle} on ${sourceName}.`);
                    captureMuteEvent(EventId.MUTE_SUCCESS, profile);
                    return result;
                }
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    muted
                        ? t`Failed to unmute @${profile.handle} on ${sourceName}.`
                        : t`Failed to mute @${profile.handle} on ${sourceName}.`,
                );
                throw error;
            }
        },
        [isLogin],
    );
}
