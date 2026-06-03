import { AsyncStatus, Source } from '@dimensiondev/enums';
import { memo, type ReactNode, useMemo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useToggleFollow } from '@/hooks/useToggleFollow.js';
import { useWatchProfileFollowStatus } from '@/hooks/useWatchProfileFollowStatus.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

interface ToggleFollowButtonProps extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    watching?: boolean;
    children: (isSuperFollow: boolean, loading: boolean) => ReactNode;
}

export const ToggleFollowButton = memo(function ToggleFollowButton({
    ref,
    profile,
    watching,
    onClick,
    children,
    ...rest
}: ToggleFollowButtonProps) {
    const isLogin = useIsLogin(profile.source);
    const following = useWatchProfileFollowStatus(profile, watching);
    const [loading, toggleFollow] = useToggleFollow({
        ...profile,
        viewerContext: {
            ...profile.viewerContext,
            following,
        },
    });

    const isMyTwitterProfilePending = useTwitterProfileStore((state) => state.status === AsyncStatus.Pending);

    const showSuperFollow = false;
    const showLoading = loading || (profile.source === Source.Twitter && isMyTwitterProfilePending);
    const buttonLabel = useMemo(() => children(showSuperFollow, showLoading), [children, showSuperFollow, showLoading]);

    return (
        <ClickableButton
            enableDefault
            enablePropagate
            {...rest}
            disabled={showLoading || rest.disabled}
            onClick={(event) => {
                onClick?.(event);
                if (following && profile.canUnfollow === false) {
                    enqueueWarningMessage('You cannot unfollow this user');
                    return;
                }
                if (!following && profile.canFollow === false) {
                    enqueueWarningMessage('You cannot follow this user');
                    return;
                }
                if (!isLogin) {
                    openLoginModalWithGuard({ source: profile.source });
                    return;
                }
                toggleFollow.mutate();
            }}
        >
            {buttonLabel}
        </ClickableButton>
    );
});
