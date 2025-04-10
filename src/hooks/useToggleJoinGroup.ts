import { t } from '@lingui/core/macro';
import { useIsMutating, useMutation } from '@tanstack/react-query';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { LoginModalRef } from '@/modals/controls.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

export function useToggleJoinGroup(group: ProfileGroup) {
    const profile = useCurrentProfile(group.source);

    const mutationKey = ['toggle-join-group', group.source, group.id, profile?.profileId];
    const isMutating = useIsMutating({ mutationKey, exact: true }) > 0;

    const mutation = useMutation({
        mutationKey,
        mutationFn: async () => {
            if (!profile?.profileId) {
                LoginModalRef.open({ source: group.source });
                return;
            }

            const joined = !!group.isMember;
            const sourceName = resolveSourceName(group.source);
            try {
                const result = joined
                    ? await LensSocialMediaProvider.leaveGroup(group.id)
                    : await LensSocialMediaProvider.joinGroup(group.id);

                enqueueSuccessMessage(
                    joined ? t`Left #${group.name} on ${sourceName}.` : t`Joined #${group.name} on ${sourceName}.`,
                );
                return result;
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    joined
                        ? t`Failed to leave #${group.name} on ${sourceName}.`
                        : t`Failed to join #${group.name} on ${sourceName}.`,
                );
                throw error;
            }
        },
    });

    return [isMutating, mutation] as const;
}
