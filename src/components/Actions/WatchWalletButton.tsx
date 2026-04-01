'use client';

import { Trans } from '@lingui/react/macro';
import { type Address } from 'viem';

import FollowIcon from '@/assets/follow-user.svg';
import UnfollowIcon from '@/assets/unfollow-user.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useIsFollowingWallet } from '@/hooks/useIsFollowingWallet.js';
import { useToggleWatchWallet } from '@/hooks/useToggleWatchWallet.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    handleOrEnsOrAddress: string;
    address: Address;
    isFollowing?: boolean;
    onSuccess?: () => void;
}

export function WatchWalletButton({ handleOrEnsOrAddress, address, isFollowing, ref, onSuccess, ...rest }: Props) {
    const { data, isLoading } = useIsFollowingWallet(address, isFollowing === undefined);
    const following = isFollowing || data;

    const mutation = useToggleWatchWallet({ handleOrEnsOrAddress, address, following: !!following });

    return (
        <MenuButton
            {...rest}
            disabled={isLoading}
            onClick={async (event) => {
                await mutation.mutateAsync();
                onSuccess?.();
                rest.onClick?.(event);
            }}
            ref={ref}
        >
            {isLoading ? (
                <LoadingIcon size={18} />
            ) : following ? (
                <UnfollowIcon width={18} height={18} />
            ) : (
                <FollowIcon width={18} height={18} />
            )}
            <span className="font-bold leading-[22px] text-main">
                {following ? (
                    <Trans>Unfollow {handleOrEnsOrAddress}</Trans>
                ) : (
                    <Trans>Follow {handleOrEnsOrAddress}</Trans>
                )}
            </span>
        </MenuButton>
    );
}
