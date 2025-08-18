import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import UserIcon from '@/assets/user.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useSuperFollowData } from '@/hooks/useSuperFollow.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { captureProfileActionEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface SuperFollowProps {
    profile: Profile;
    showCloseButton?: boolean;
    onClose: () => void;
}

export const SuperFollow = memo<SuperFollowProps>(function SuperFollow({ profile, showCloseButton = true, onClose }) {
    const account = useAccount();
    const { loading, followModule, isConnected, allowanceModule, hasAmount, hasAllowance, address } =
        useSuperFollowData(profile);

    const wrongAddress = !isSameEthereumAddress(address, account.address);
    const feeAmount = Number.parseFloat(followModule?.amount?.value || '0');
    const feeSymbol = followModule?.amount?.asset.symbol;

    const [{ loading: isFollowing }, handleFollow] = useAsyncFn(async () => {
        try {
            if (!followModule || !allowanceModule) return;
            if (!isConnected) {
                WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
                return;
            }
            if (!hasAllowance) {
                await LensSocialMediaProvider.approveModuleAllowance(
                    allowanceModule,
                    Number.MAX_SAFE_INTEGER.toString(),
                );
                return;
            }

            captureProfileActionEvent('super_follow_submit', profile, {
                followerWalletAddress: account.address,
            });
            await LensSocialMediaProvider.superFollow(profile.profileId);
            enqueueSuccessMessage(t`Followed @${profile.handle} on Lens`);
            captureProfileActionEvent('super_follow', profile, {
                followerWalletAddress: account.address,
            });
            onClose?.();
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to follow @${profile.handle} on Lens`);
            throw error;
        }
    }, [account.address, followModule, allowanceModule, isConnected, hasAllowance, profile, onClose]);

    const buttonLabel = useMemo(() => {
        if (isFollowing) return <Trans>Following</Trans>;
        // cspell: disable-next-line
        if (!followModule) return <Trans>This profile doesn&apos;t enable super follow</Trans>;
        if (!isConnected) return <Trans>Connect your wallet to follow</Trans>;
        if (wrongAddress) return <Trans>Please switch to ${formatAddressEthereum(address, 4)}</Trans>;
        if (!hasAmount) return <Trans>Insufficient Balance</Trans>;
        if (!hasAllowance) return <Trans>Allow Follow Module</Trans>;
        if (feeAmount && feeSymbol)
            return (
                <Trans>
                    Follow for ${feeAmount} $${feeSymbol}
                </Trans>
            );
        return <Trans>Follow</Trans>;
    }, [isConnected, hasAmount, hasAllowance, followModule, wrongAddress, address, feeAmount, feeSymbol, isFollowing]);

    const disabled =
        loading || isFollowing || (isConnected && (!followModule || !allowanceModule || !hasAmount || wrongAddress));

    return (
        <div className="w-full">
            <div className="relative text-center">
                {showCloseButton ? (
                    <CloseButton onClick={() => onClose?.()} className="absolute -top-1 left-0" />
                ) : null}
                <span className="text-lg font-bold leading-6 text-lightMain">
                    <Trans>Super Follow</Trans>
                </span>
            </div>
            <div className="mt-6 rounded-lg bg-lightBg px-3 py-2">
                <div className="flex items-center gap-2.5">
                    <span>
                        <ProfileAvatar profile={profile} size={48} linkable={false} enableSourceIcon={false} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <span className="truncate text-medium font-bold text-lightMain">{profile.displayName}</span>
                            <SocialSourceIcon source={profile.source} size={15} className="shrink-0" />
                        </div>
                        <div className="flex items-center gap-1 text-medium text-second">
                            <span className="truncate">@{profile.handle}</span>
                            <UserIcon width={15} height={15} className="shrink-0" />
                            <span>{nFormatter(profile.followerCount)}</span>
                        </div>
                    </div>
                </div>
                <BioMarkup
                    className="mt-1.5 line-clamp-2 text-left text-medium text-lightMain"
                    source={profile.source}
                    profile={profile}
                >
                    {profile.bio || '--'}
                </BioMarkup>
            </div>
            <p className="mt-3 text-medium font-bold text-second">
                <Trans>
                    Pay
                    <span className="text-lightMain">{` ${feeAmount} $${feeSymbol} `}</span>
                    to follow and get some awesome perks!
                </Trans>
            </p>
            <ClickableButton
                disabled={disabled}
                className="mt-6 flex h-10 w-full items-center justify-center rounded-[20px] bg-lightMain text-medium font-bold text-primaryBottom"
                onClick={handleFollow}
                loading={loading || isFollowing}
                onlyLoading={!isFollowing}
            >
                <span>{buttonLabel}</span>
            </ClickableButton>
        </div>
    );
});
