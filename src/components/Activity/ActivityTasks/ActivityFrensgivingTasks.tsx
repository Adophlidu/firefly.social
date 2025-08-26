'use client';

import { Trans } from '@lingui/react/macro';

import { ActivityClaimButton } from '@/components/Activity/ActivityClaimButton.js';
import { ActivityConnectCard } from '@/components/Activity/ActivityConnectCard.js';
import { ActivityLoginButton } from '@/components/Activity/ActivityLoginButton.js';
import { ActivityPremiumConditionList } from '@/components/Activity/ActivityPremiumConditionList.js';
import { ActivityPremiumListProvider } from '@/components/Activity/ActivityPremiumListContext.js';
import { ActivityVerifyText } from '@/components/Activity/ActivityVerifyText.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { useActivityShareUrl } from '@/components/Activity/hooks/useActivityShareUrl.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';
import { type Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function ActivityFrensgivingTasks({
    data,
}: {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status' | 'name'>;
}) {
    const shareUrl = useActivityShareUrl(data.name);
    const shareContent = [
        'Just earned $ANON by minting the Firefly Farcaster Frensgiving 🦃✨ collectible from ',
        FIREFLY_MENTION,
        '\n\nClaim here ',
        shareUrl,
        ' \n\n#Frensgiving #Thanksgiving #Farcaster #FireflySocial',
    ];
    const { data: claimCondition } = useActivityClaimCondition(Source.Farcaster);
    const verifiedBasic = !!(
        claimCondition?.farcaster &&
        (claimCondition.farcaster.hasThirdpartSigner || Number.parseInt(claimCondition.farcaster.fid, 10) <= 100_000)
    );
    const list = [
        {
            label: <Trans>Your Farcaster account holds Power Badge</Trans>,
            verified: claimCondition?.farcaster?.isPowerUser ?? false,
        },
        {
            label: <Trans>You have been detected as a loyal Farcaster user</Trans>,
            verified: !!(
                claimCondition?.farcaster?.isSupercast ||
                (claimCondition?.farcaster && Number.parseInt(claimCondition.farcaster.fid, 10) <= 10000)
            ),
        },
    ];
    const isPremium = list.some((x) => x.verified);

    return (
        <ActivityPremiumListProvider list={list}>
            <div className="mb-4 w-full space-y-4 px-6 py-4">
                <div className="flex w-full flex-col space-y-2">
                    <div className="flex h-8 items-center justify-between">
                        <h2 className="text-base font-semibold leading-6">
                            <Trans>Check Eligibility</Trans>
                        </h2>
                        <ActivityLoginButton source={Source.Farcaster} />
                    </div>
                </div>
                <div
                    className={classNames(
                        'flex w-full flex-col space-y-2 rounded-2xl p-3 text-sm font-normal leading-6',
                        verifiedBasic ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
                    )}
                >
                    <ActivityVerifyText verified={verifiedBasic}>
                        <Trans>
                            Available to users with Farcaster ID under 100,000 or users of select third-party Farcaster
                            apps as of our snapshot
                        </Trans>
                    </ActivityVerifyText>
                </div>
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Connect Wallet</Trans>
                </h2>
                <ActivityConnectCard
                    source={Source.Farcaster}
                    chainId={EthereumChainId.Base}
                    label={<Trans>Submit a wallet to receive NFT and $ANON</Trans>}
                />
                <div className="flex w-full flex-col space-y-2 text-sm font-semibold leading-6">
                    <h2 className="text-base font-semibold leading-6">
                        <Trans>Eligible for Premium Collectible?</Trans>
                    </h2>
                    <ActivityPremiumConditionList
                        title={
                            <Trans>Meet any of the following to unlock a premium collectible and get more $ANON:</Trans>
                        }
                    />
                </div>
            </div>
            <div className="sticky bottom-0 mt-auto w-full bg-primaryBottom px-4 pt-1.5 pb-safe-or-4 sm:pb-safe-or-2">
                <ActivityClaimButton
                    status={data.status}
                    shareContent={shareContent as Chars}
                    source={Source.Farcaster}
                    claimType={isPremium ? 'premium' : 'base'}
                />
            </div>
        </ActivityPremiumListProvider>
    );
}
