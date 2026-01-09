import { memo, type ReactNode, useMemo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { AsyncStatus, Source } from '@/constants/enum.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useToggleFollow } from '@/hooks/useToggleFollow.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

interface ToggleFollowButtonProps extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    children: (isSuperFollow: boolean, loading: boolean) => ReactNode;
}

export const ToggleFollowButton = memo(function ToggleFollowButton({
    ref,
    profile,
    onClick,
    children,
    ...rest
}: ToggleFollowButtonProps) {
    const [loading, toggleFollow] = useToggleFollow(profile);
    const isLogin = useIsLogin(profile.source);

    const following = !!profile.viewerContext?.following;
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
                    openLoginModal({ source: profile.source });
                    return;
                }
                toggleFollow.mutate();
            }}
        >
            {buttonLabel}
        </ClickableButton>
    );
});
