import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';
import { useHover } from 'react-use';

import FollowIcon from '@/assets/follow-bold.svg';
import FollowedIcon from '@/assets/followed.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';

interface ToggleJoinButtonProps extends ClickableButtonProps {
    joined: boolean;
    variant?: 'text' | 'icon';
    joinLabel?: ReactNode;
    joinedLabel?: ReactNode;
    leaveLabel?: ReactNode;
}

export const ToggleJoinButton = memo<ToggleJoinButtonProps>(function ToggleJoinButton({
    joined,
    variant = 'text',
    joinLabel = <Trans>Join</Trans>,
    leaveLabel = <Trans>Leave</Trans>,
    joinedLabel = <Trans>Joined</Trans>,
    className,
    ...rest
}) {
    const [hoverable] = useHover((hovered) => {
        const label =
            variant === 'icon' ? (
                joined ? (
                    <FollowedIcon className="size-4 shrink-0" />
                ) : (
                    <FollowIcon className="size-4 shrink-0" />
                )
            ) : joined ? (
                hovered ? (
                    leaveLabel
                ) : (
                    joinedLabel
                )
            ) : (
                joinLabel
            );

        return (
            <ClickableButton
                className={classNames('flex h-8 items-center justify-center', className, {
                    'w-8 rounded-full bg-main text-primaryBottom': variant === 'icon',
                    'rounded-lg px-5 text-medium font-bold': variant === 'text',
                    'bg-main text-primaryBottom hover:opacity-80': !joined,
                    'border border-main text-main hover:border-danger hover:bg-danger/50 hover:text-danger':
                        joined && variant === 'text',
                })}
                onlyLoading
                {...rest}
            >
                {label}
            </ClickableButton>
        );
    });

    return hoverable;
});
