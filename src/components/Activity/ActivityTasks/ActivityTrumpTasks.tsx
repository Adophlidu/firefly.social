import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useContext, useState } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
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
import { ClickableButton } from '@/components/ClickableButton.js';
import { Popover } from '@/components/Popover.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { FIREFLY_MENTION, FIREFLY_TWITTER_PROFILE, TRUMP_TWITTER_PROFILE } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { replaceObjectInStringArray } from '@/helpers/replaceObjectInStringArray.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { Level } from '@/providers/types/CZ.js';
import { type ActivityInfoResponse, ActivityStatus } from '@/providers/types/Firefly.js';
import type { Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

function DisclaimerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Popover
            open={open}
            onClose={onClose}
            dialogPanelClassName="!max-w-[386px]"
            hiddenTopLine
            enableOverflow={false}
        >
            <h3 className="w-full text-center text-lg font-bold">
                <Trans>Disclaimer</Trans>
            </h3>
            <div className="mt-4 w-full text-medium leading-[18px]">
                <Trans>
                    <p className="mb-4">
                        By participating, you confirm that you are at least 18 years old and reside in a jurisdiction
                        where such promotions are lawful. This promotion is void where prohibited by law.
                    </p>
                    <p className="mb-4">
                        No purchase or payment is required to enter or win, and such actions will not affect your
                        chances of winning. Winners will be selected randomly through a transparent process. Entries
                        must be submitted by January 23, 2025.
                    </p>
                    <p className="mb-4">
                        Participants are responsible for ensuring compliance with applicable laws. We disclaim liability
                        for any losses arising from participation. By participating, you release us from all liability
                        to the fullest extent permitted by law.
                    </p>
                </Trans>
            </div>
            <ActionButton onClick={onClose}>
                <Trans>Done</Trans>
            </ActionButton>
        </Popover>
    );
}

export function ActivityTrumpTasks({
    data,
}: {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status' | 'name'>;
}) {
    const { address, premiumAddress } = useContext(ActivityContext);
    const { data: claimCondition } = useActivityClaimCondition(Source.Twitter);
    const list = [
        {
            label: <Trans>Your X account holds Premium status</Trans>,
            verified: claimCondition?.x.valid && claimCondition?.x?.level === Level.Lv2,
        },
        {
            label: (
                <p>
                    <Trans>
                        You are holder of{' '}
                        <Link
                            href={resolveNFTUrl(EthereumChainId.Base, '0x70553bbec6f7d2c5e6e1bc02f821f6863546d11e')}
                            className="inline text-highlight"
                        >
                            Presidential Election 2024
                        </Link>{' '}
                        NFT and voted Trump
                    </Trans>
                </p>
            ),
            verified: claimCondition?.nft?.valid && claimCondition?.nft?.level === Level.Lv2,
        },
    ];
    const isPremium = list.some((x) => x.verified);
    const followTrumpTwitterProfile = {
        handle: TRUMP_TWITTER_PROFILE.handle,
        profileId: TRUMP_TWITTER_PROFILE.platform_id,
        following: claimCondition?.x?.followingTrump,
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
            t`Just joined this exclusive raffle event "🇺🇸 Winning with $TRUMP 🇺🇸" from ${fireflyMention}

Check your eligibility and participate here ${shareUrl}

#TRUMP #FireflySocial`,
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
    const [openDisclaimer, setOpenDisclaimer] = useState(false);

    return (
        <ActivityPremiumListProvider list={list}>
            <DisclaimerDialog open={openDisclaimer} onClose={() => setOpenDisclaimer(false)} />
            <div className="mb-4 w-full space-y-4 px-6 pt-4">
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
                        followTrumpTwitterProfile.following ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
                    )}
                >
                    <ActivityVerifyText verified={followTrumpTwitterProfile.following}>
                        <h3>
                            <Trans>
                                Followed{' '}
                                <Link
                                    className="inline text-highlight"
                                    href={getProfileUrl({
                                        source: Source.Twitter,
                                        profileId: followTrumpTwitterProfile.profileId,
                                        handle: followTrumpTwitterProfile.handle,
                                    })}
                                >
                                    @{followTrumpTwitterProfile.handle}
                                </Link>{' '}
                                on X before Jan 18, 2025
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
                    label={address ? <Trans>Wallet submitted</Trans> : <Trans>submit a wallet to receive $TRUMP</Trans>}
                />
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Eligible for Premium?</Trans>
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
                        title={<Trans>Meet any of the following to unlock premium status and get more $Trump:</Trans>}
                    />
                </div>
            </div>
            <p className="mb-4 w-full px-6 text-center text-[10px]">
                <Trans>
                    Read this{' '}
                    <ClickableButton className="inline text-highlight" onClick={() => setOpenDisclaimer(true)}>
                        disclaimer
                    </ClickableButton>{' '}
                    before participation. For any inquiries, please{' '}
                    <Link href={FIREFLY_TELEGRAM_URL} target="_blank" className="inline text-highlight">
                        contact us
                    </Link>
                    . All rights reserved by Firefly.
                </Trans>
            </p>
            <div
                className={classNames(
                    'sticky bottom-0 mt-auto w-full bg-primaryBottom px-4',
                    fireflyBridgeProvider.supported && IS_ANDROID
                        ? 'pb-safe-or-8'
                        : 'pt-1.5 pb-safe-or-4 max-md:pb-safe-or-2',
                )}
            >
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
