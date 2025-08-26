'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useContext, useMemo } from 'react';

import { ActivityClaimButton } from '@/components/Activity/ActivityClaimButton.js';
import { ActivityConnectCard } from '@/components/Activity/ActivityConnectCard.js';
import { ActivityContactUs } from '@/components/Activity/ActivityContactUs.js';
import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { ActivityLoginButton } from '@/components/Activity/ActivityLoginButton.js';
import { ActivityPremiumConditionList } from '@/components/Activity/ActivityPremiumConditionList.js';
import { ActivityPremiumListProvider } from '@/components/Activity/ActivityPremiumListContext.js';
import { ActivityVerifyText } from '@/components/Activity/ActivityVerifyText.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { useActivityShareUrl } from '@/components/Activity/hooks/useActivityShareUrl.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { replaceObjectInStringArray } from '@/helpers/replaceObjectInStringArray.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';
import type { Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function ActivityButtrflyTasks({
    data,
}: {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status' | 'name'>;
}) {
    const { address } = useContext(ActivityContext);
    const { data: claimCondition } = useActivityClaimCondition(Source.Lens);
    const list = [
        {
            label: <Trans>Top 500 Buttrfly Points Leaderboard</Trans>,
            verified: claimCondition?.lens?.isTopUser,
        },
    ];
    const shareUrl = useActivityShareUrl(data.name);
    const shareContent = useMemo(() => {
        const fireflyMention = 'FIREFLY_MENTION';
        return replaceObjectInStringArray(
            t`Just earned $MASK by minting the Buttrfly Fren 🦋 collectible from ${fireflyMention} 

Claim here ${shareUrl}`,
            {
                [fireflyMention]: FIREFLY_MENTION,
            },
        );
    }, [shareUrl]);
    const isPremium = list.some((x) => x.verified);

    return (
        <ActivityPremiumListProvider list={list}>
            <div className="mb-4 w-full space-y-4 px-6 py-4">
                <div className="flex w-full flex-col space-y-2">
                    <div className="flex h-8 items-center justify-between">
                        <h2 className="text-base font-semibold leading-6">
                            <Trans>Check Eligibility</Trans>
                        </h2>
                        <ActivityLoginButton source={Source.Lens} />
                    </div>
                </div>
                <div
                    className={classNames(
                        'w-full rounded-2xl p-3 text-sm font-normal leading-6',
                        claimCondition?.lens?.isActiveUser ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
                    )}
                >
                    <ActivityVerifyText verified={claimCondition?.lens?.isActiveUser} hasFailedIcon>
                        <h3>
                            <Trans>Posted to Lens on Buttrfly since August 1, 2024</Trans>
                        </h3>
                    </ActivityVerifyText>
                </div>
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Connect Wallet</Trans>
                </h2>
                <ActivityConnectCard
                    chainId={EthereumChainId.Polygon}
                    source={Source.Lens}
                    label={
                        address ? (
                            <Trans>Wallet submitted</Trans>
                        ) : (
                            <Trans>Submit a wallet to receive a collectible and $MASK airdrop</Trans>
                        )
                    }
                />
                <div className="mb-4 flex w-full flex-col space-y-2 text-sm font-semibold leading-6">
                    <h2 className="text-base font-semibold leading-6">
                        <Trans>Eligible for Premium?</Trans>
                    </h2>
                    <ActivityPremiumConditionList
                        title={<Trans>Unlock a premium collectible and a larger $MASK airdrop </Trans>}
                    />
                </div>
                <ActivityContactUs />
            </div>
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
                    source={Source.Lens}
                    claimType={isPremium ? 'premium' : 'base'}
                />
            </div>
        </ActivityPremiumListProvider>
    );
}
