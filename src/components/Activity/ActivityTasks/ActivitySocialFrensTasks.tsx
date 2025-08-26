'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useContext, useMemo } from 'react';

import { ActivityClaimButton } from '@/components/Activity/ActivityClaimButton.js';
import { ActivityConnectCard } from '@/components/Activity/ActivityConnectCard.js';
import { ActivityContactUs } from '@/components/Activity/ActivityContactUs.js';
import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { ActivityLoginButtonWithMultipleSources } from '@/components/Activity/ActivityLoginButton.js';
import { ActivityVerifyText } from '@/components/Activity/ActivityVerifyText.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { useActivityCurrentAccountHandle } from '@/components/Activity/hooks/useActivityCurrentAccountHandle.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { replaceObjectInStringArray } from '@/helpers/replaceObjectInStringArray.js';
import { resolveActivityShareUrl } from '@/helpers/resolveActivityUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { type ActivityInfoResponse, ActivityStatus } from '@/providers/types/Firefly.js';
import type { Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

const sources: SocialSource[] = [Source.Lens, Source.Farcaster];

export function ActivitySocialFrensTasks({
    data,
}: {
    data: Pick<Required<ActivityInfoResponse>['data'], 'status' | 'name'>;
}) {
    const { name, address } = useContext(ActivityContext);
    const { data: claimCondition } = useActivityClaimCondition(sources);
    const farHandle = useActivityCurrentAccountHandle(Source.Farcaster);
    const lensHandle = useActivityCurrentAccountHandle(Source.Lens);
    const primarySource = lensHandle ? Source.Lens : Source.Farcaster;

    const shareContent = useMemo(() => {
        const fireflyMention = 'FIREFLY_MENTION';
        const shareUrl = resolveActivityShareUrl(name, primarySource, lensHandle ? lensHandle : farHandle);
        return replaceObjectInStringArray(
            t`Just earned $MASK by minting the Inviting Yup & Phaver frens🌟 collectible from ${fireflyMention}  

Claim here ${shareUrl}`,
            {
                [fireflyMention]: FIREFLY_MENTION,
            },
        );
    }, [farHandle, lensHandle, name, primarySource]);

    const verified = !!(claimCondition?.lens?.valid || claimCondition?.farcaster?.valid);
    const blocked =
        {
            [Source.Lens]: claimCondition?.lens?.participationBlocked,
            [Source.Farcaster]: claimCondition?.farcaster?.participationBlocked,
        }[primarySource] ?? false;
    const buttonText = useMemo(() => {
        if (blocked) {
            return <Trans>Participation Blocked</Trans>;
        }
        const status = data.status;
        switch (status) {
            case ActivityStatus.Upcoming:
                return <Trans>Not Started</Trans>;
            case ActivityStatus.Ended:
                return <Trans>Ended</Trans>;
            case ActivityStatus.Active:
                if (claimCondition?.alreadyClaimed) {
                    return <Trans>Claimed</Trans>;
                }
                return <Trans>Claim Now</Trans>;
            default:
                safeUnreachable(status);
                return null;
        }
    }, [blocked, claimCondition?.alreadyClaimed, data.status]);

    return (
        <>
            <div className="mb-4 w-full space-y-4 px-6 py-4">
                <div className="flex w-full flex-col space-y-2">
                    <div className="flex h-8 items-center justify-between">
                        <h2 className="text-base font-semibold leading-6">
                            <Trans>Check Eligibility</Trans>
                        </h2>
                        <ActivityLoginButtonWithMultipleSources sources={sources} />
                    </div>
                </div>
                <div
                    className={classNames(
                        'w-full rounded-2xl p-3 text-sm font-normal leading-6',
                        verified ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
                    )}
                >
                    <ActivityVerifyText verified={verified} hasFailedIcon>
                        <div>
                            <h3>
                                <Trans>
                                    Posted on the following apps since August 1, 2024, and new Firefly users only:
                                </Trans>
                            </h3>
                            <br />
                            <ol className="list-inside list-decimal">
                                <li>
                                    <Trans>
                                        Posted to Lens or Farcaster on <b>Yup</b>
                                    </Trans>
                                </li>
                                <li>
                                    <Trans>
                                        Posted to Lens on <b>Phaver</b>
                                    </Trans>
                                </li>
                                <li>
                                    <Trans>
                                        Posted to Farcaster on <b>Supercast</b>
                                    </Trans>
                                </li>
                            </ol>
                        </div>
                    </ActivityVerifyText>
                </div>
                <h2 className="text-base font-semibold leading-6">
                    <Trans>Connect Wallet</Trans>
                </h2>
                <ActivityConnectCard
                    chainId={EthereumChainId.Polygon}
                    source={sources}
                    label={
                        address ? (
                            <Trans>Wallet submitted</Trans>
                        ) : (
                            <Trans>Submit a wallet to receive a collectible and $MASK airdrop</Trans>
                        )
                    }
                />
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
                    source={sources}
                    claimType={primarySource}
                    disabled={blocked}
                    buttonText={buttonText}
                />
            </div>
        </>
    );
}
