'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { Headline } from '@/app/(settings)/components/Headline.js';
import {
    NotificationConfigItem,
    type NotificationConfigItemProps,
} from '@/app/(settings)/components/NotificationConfigItem.js';
import { Section } from '@/app/(settings)/components/Section.js';
import { Subtitle } from '@/app/(settings)/components/Subtitle.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import {
    NotificationPlatform,
    type NotificationPushSwitchResponse,
    NotificationPushType,
    NotificationTitle,
} from '@/providers/types/Firefly.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

function getStatusForConfigs(
    configs: NotificationConfigItemProps[],
    statusList: Required<NotificationPushSwitchResponse>['data']['list'],
) {
    const allStatus = Object.values(statusList).flatMap((x) => x.list);
    return configs.map((config) => {
        const status = allStatus.find((x) => x.platform === config.platform && x.push_type === config.pushType);
        return {
            ...config,
            unsupported: !status,
            value: status?.state === true,
        };
    });
}

export default function General() {
    useNavigatorTitle(t`Push notifications`);

    const { data, isLoading } = useQuery({
        queryKey: ['notification-settings', 'config'],
        queryFn: async () => {
            const data = await FireflySocialMediaProvider.getNotificationPushSwitch();
            return data?.list || [];
        },
    });

    const { myAccountConfigs, otherAccountConfigs } = useMemo(
        () => ({
            myAccountConfigs: getStatusForConfigs(
                [
                    {
                        label: <Trans>Tips</Trans>,
                        description: <Trans>firefly.eth tipped you 100 USDC</Trans>,
                        platform: NotificationPlatform.Tips,
                        pushType: NotificationPushType.OnChainTips,
                        type: NotificationTitle.Tips,
                        value: true,
                    },
                    {
                        label: <Trans>Likes</Trans>,
                        description: <Trans>firefly.eth liked your transaction</Trans>,
                        platform: NotificationPlatform.OnChain,
                        pushType: NotificationPushType.OnChainLike,
                        type: NotificationTitle.OnChain,
                        value: true,
                    },
                ],
                data || [],
            ),
            otherAccountConfigs: getStatusForConfigs(
                [
                    {
                        label: <Trans>Swaps</Trans>,
                        description: <Trans>firefly.eth swapped 1850 USDC for 0.5 ETH</Trans>,
                        platform: NotificationPlatform.OnChain,
                        pushType: NotificationPushType.OnChainSwap,
                        type: NotificationTitle.OnChain,
                        value: true,
                    },
                ],
                data || [],
            ),
        }),
        [data],
    );

    useEffect(() => {
        setupFirebaseFcmConnection({ force: true, showUi: true });
    }, []);

    return (
        <Section>
            <Headline>
                <Trans>Push notifications</Trans>
            </Headline>

            <div className="relative w-full">
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <LoadingIcon size={24} />
                    </div>
                ) : (
                    <>
                        <Subtitle className="leading-6">Your accounts</Subtitle>
                        {myAccountConfigs.map((config, index) => (
                            <NotificationConfigItem key={`your-${index}`} {...config} />
                        ))}
                        <Subtitle className="mt-6 leading-6">Others’ accounts</Subtitle>
                        {otherAccountConfigs.map((config, index) => (
                            <NotificationConfigItem key={`other-${index}`} {...config} />
                        ))}
                    </>
                )}
            </div>
        </Section>
    );
}
