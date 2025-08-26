import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useContext, useState } from 'react';

import { ActivityClaimButton } from '@/components/Activity/ActivityClaimButton.js';
import { ActivityConnectCard } from '@/components/Activity/ActivityConnectCard.js';
import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { ActivityLoginButton } from '@/components/Activity/ActivityLoginButton.js';
import { ActivityNormalSuccessDialog } from '@/components/Activity/ActivityNormalSuccessDialog.js';
import { ActivityPremiumAddressVerifyCard } from '@/components/Activity/ActivityPremiumAddressVerifyCard.js';
import { ActivityPremiumConditionList } from '@/components/Activity/ActivityPremiumConditionList.js';
import { ActivityPremiumListProvider } from '@/components/Activity/ActivityPremiumListContext.js';
import { ActivityTaskFollowCard } from '@/components/Activity/ActivityTaskFollowCard.js';
import { ActivityVerifyText } from '@/components/Activity/ActivityVerifyText.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { useActivityShareUrl } from '@/components/Activity/hooks/useActivityShareUrl.js';
import { useIsFollowInActivity } from '@/components/Activity/hooks/useIsFollowInActivity.js';
import { Link } from '@/components/Activity/Link.js';
import { Source } from '@/constants/enum.js';
import {
    LIL_PUDGY_NFT_ADDRESS,
    PENGU_PINS_NFT_ADDRESS,
    PUDGY_PENGUINS_NFT_ADDRESS,
    TRUE_PENGU_NFT_ADDRESS,
} from '@/constants/index.js';
import { FIREFLY_MENTION, FIREFLY_TWITTER_PROFILE, PUDGY_PENGUINS_TWITTER_PROFILE } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { replaceObjectInStringArray } from '@/helpers/replaceObjectInStringArray.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { type ActivityInfoResponse, ActivityStatus } from '@/providers/types/Firefly.js';
import { type Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function ActivityPenguTasks({
    data,
}: {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status' | 'name'>;
}) {
    const { address, premiumAddress } = useContext(ActivityContext);
    const { data: claimCondition } = useActivityClaimCondition(Source.Twitter);
    const list = [
        {
            label: (
                <p>
                    <Trans>
                        You are holder of{' '}
                        <Link
                            href={resolveNFTUrl(EthereumChainId.Mainnet, PUDGY_PENGUINS_NFT_ADDRESS)}
                            className="inline text-highlight"
                        >
                            Pudgy Penguins
                        </Link>{' '}
                        or{' '}
                        <Link
                            href={resolveNFTUrl(EthereumChainId.Mainnet, LIL_PUDGY_NFT_ADDRESS)}
                            className="inline text-highlight"
                        >
                            Lil Pudgy
                        </Link>{' '}
                        NFTs
                    </Trans>
                </p>
            ),
            verified: claimCondition?.nft?.ownPudgy || claimCondition?.nft?.ownLil,
        },
        {
            label: (
                <p>
                    <Trans>
                        You are holder of{' '}
                        <Link
                            href={resolveNFTUrl(EthereumChainId.Mainnet, TRUE_PENGU_NFT_ADDRESS)}
                            className="inline text-highlight"
                        >
                            truePengu
                        </Link>{' '}
                        or{' '}
                        <Link
                            href={resolveNFTUrl(EthereumChainId.Mainnet, PENGU_PINS_NFT_ADDRESS)}
                            className="inline text-highlight"
                        >
                            penguPins
                        </Link>{' '}
                        Soulbound NFTs
                    </Trans>
                </p>
            ),
            verified: claimCondition?.nft?.ownPudgy || claimCondition?.nft?.ownPenguPins,
        },
    ];
    const isPremium = list.some((x) => x.verified);
    const followPenguTwitterProfile = {
        handle: PUDGY_PENGUINS_TWITTER_PROFILE.handle,
        profileId: PUDGY_PENGUINS_TWITTER_PROFILE.platform_id,
        following: claimCondition?.x?.followingPudge,
    };
    const { data: isFollowedFirefly } = useIsFollowInActivity(
        Source.Twitter,
        FIREFLY_TWITTER_PROFILE.platform_id,
        FIREFLY_TWITTER_PROFILE.handle,
    );
    const shareUrl = useActivityShareUrl(data.name);
    const shareContent = runInSafe(() => {
        const fireflyMention = 'FIREFLY_MENTION';
        return replaceObjectInStringArray(
            t`Just submitted my wallet to receive my Christmas gift. Let's skate into the holiday season with $PENGU on ${fireflyMention}

Submit here ${shareUrl}

#PENGU #FireflySocial`,
            {
                [fireflyMention]: FIREFLY_MENTION,
            },
        );
    });

    const disabled = !isFollowedFirefly;
    const buttonText = runInSafe(() => {
        const status = data.status;
        switch (status) {
            case ActivityStatus.Upcoming:
                return <Trans>Not Started</Trans>;
            case ActivityStatus.Ended:
                return <Trans>Ended</Trans>;
            case ActivityStatus.Active:
                if (claimCondition?.participationBlocked) {
                    return <Trans>Participation Blocked</Trans>;
                }
                if (claimCondition?.alreadyClaimed) {
                    return <Trans>Participated</Trans>;
                }
                return <Trans>Participate Now</Trans>;
            default:
                safeUnreachable(status);
                return null;
        }
    });
    const [isSuccessParticipate, setIsSuccessParticipate] = useState(false);

    return (
        <ActivityPremiumListProvider
            list={[
                {
                    label: (
                        <p>
                            <Trans>
                                You are holder of{' '}
                                <Link
                                    href={resolveNFTUrl(EthereumChainId.Mainnet, PUDGY_PENGUINS_NFT_ADDRESS)}
                                    className="inline text-highlight"
                                >
                                    Pudgy Penguins
                                </Link>{' '}
                                or{' '}
                                <Link
                                    href={resolveNFTUrl(EthereumChainId.Mainnet, LIL_PUDGY_NFT_ADDRESS)}
                                    className="inline text-highlight"
                                >
                                    Lil Pudgy
                                </Link>{' '}
                                NFTs
                            </Trans>
                        </p>
                    ),
                    verified: claimCondition?.nft?.ownPudgy || claimCondition?.nft?.ownLil,
                },
                {
                    label: (
                        <p>
                            <Trans>
                                You are holder of{' '}
                                <Link
                                    href={resolveNFTUrl(EthereumChainId.Mainnet, TRUE_PENGU_NFT_ADDRESS)}
                                    className="inline text-highlight"
                                >
                                    truePengu
                                </Link>{' '}
                                or{' '}
                                <Link
                                    href={resolveNFTUrl(EthereumChainId.Mainnet, PENGU_PINS_NFT_ADDRESS)}
                                    className="inline text-highlight"
                                >
                                    penguPins
                                </Link>{' '}
                                Soulbound NFTs
                            </Trans>
                        </p>
                    ),
                    verified: claimCondition?.nft?.ownPudgy || claimCondition?.nft?.ownPenguPins,
                },
            ]}
        >
            <div className="mb-4 w-full space-y-4 px-6 py-4">
                <div className="flex w-full flex-col space-y-2">
                    <div className="flex h-8 items-center justify-between">
                        <h2 className="text-base font-semibold leading-6">
                            <Trans>Check Eligibility</Trans>
                        </h2>
                        <ActivityLoginButton source={Source.Twitter} />
                    </div>
                </div>
                <div
                    className={classNames(
                        'w-full rounded-2xl p-3 text-sm font-normal leading-6',
                        followPenguTwitterProfile.following ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
                    )}
                >
                    <ActivityVerifyText verified={followPenguTwitterProfile.following}>
                        <h3>
                            <Trans>
                                Followed{' '}
                                <Link
                                    className="inline text-highlight"
                                    href={getProfileUrl({
                                        source: Source.Twitter,
                                        profileId: followPenguTwitterProfile.profileId,
                                        handle: followPenguTwitterProfile.handle,
                                    })}
                                >
                                    @{followPenguTwitterProfile.handle}
                                </Link>{' '}
                                on X before Dec 16, 2024
                            </Trans>
                        </h3>
                    </ActivityVerifyText>
                </div>
                <ActivityTaskFollowCard
                    source={Source.Twitter}
                    handle={FIREFLY_TWITTER_PROFILE.handle}
                    profileId={FIREFLY_TWITTER_PROFILE.platform_id}
                />
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Connect Wallet</Trans>
                </h2>
                <ActivityConnectCard
                    chainId={SolanaChainId.Mainnet}
                    source={Source.Twitter}
                    label={address ? <Trans>Wallet submitted</Trans> : <Trans>Submit a wallet to receive NFT</Trans>}
                />
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Eligible for Premium Collectible?</Trans>
                </h2>
                <ActivityPremiumAddressVerifyCard
                    chainId={EthereumChainId.Mainnet}
                    source={Source.Twitter}
                    label={
                        premiumAddress ? <Trans>Wallet submitted</Trans> : <Trans>Submit an evm wallet to check</Trans>
                    }
                />
                <div className="flex w-full flex-col space-y-2 text-sm font-semibold leading-6">
                    <ActivityPremiumConditionList
                        title={<Trans>Meet any of the following to unlock a premium collectible:</Trans>}
                    >
                        <p className="pt-4 text-sm font-normal leading-6">
                            <Trans>*Note: Each NFT can only be used once.</Trans>
                        </p>
                    </ActivityPremiumConditionList>
                </div>
            </div>
            <div className="sticky bottom-0 mt-auto w-full bg-primaryBottom px-4 pt-1.5 pb-safe-or-4 sm:pb-safe-or-2">
                <ActivityClaimButton
                    status={data.status}
                    shareContent={shareContent as Chars}
                    claimType={isPremium ? 'premium' : 'base'}
                    disabled={disabled}
                    source={Source.Twitter}
                    buttonText={buttonText}
                    claimApiExtraParams={{
                        evmWalletAddress: premiumAddress,
                        solanaWalletAddress: address,
                    }}
                    onSuccess={useCallback(() => {
                        setIsSuccessParticipate(true);
                    }, [])}
                    hasSuccessDialog={false}
                />
                <ActivityNormalSuccessDialog
                    shareContent={shareContent as Chars}
                    claimType={isPremium ? 'premium' : 'base'}
                    open={isSuccessParticipate}
                    onClose={() => setIsSuccessParticipate(false)}
                />
            </div>
        </ActivityPremiumListProvider>
    );
}
