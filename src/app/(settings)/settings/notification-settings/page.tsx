'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { Headline } from '@/app/(settings)/components/Headline.js';
import {
    NotificationConfigItem,
    type NotificationConfigItemProps,
} from '@/app/(settings)/components/NotificationConfigItem.js';
import { Section } from '@/app/(settings)/components/Section.js';
import { Subtitle } from '@/app/(settings)/components/Subtitle.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
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
    return configs.map((config) => {
        const status = statusList
            .find((x) => x.title === config.type)
            ?.list.find((x) => x.platform === config.platform && x.push_type === config.pushType);
        return {
            ...config,
            unsupported: !status,
            value: status?.state === true,
        };
    });
}

export default function General() {
    useNavigatorTitle(t`Push notifications`);
    const [agreed, setAgreed] = useState(Notification.permission === 'granted');

    const { data, isLoading, isRefetching } = useQuery({
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
                        platform: NotificationPlatform.OnChain,
                        pushType: NotificationPushType.OnChainTips,
                        type: NotificationTitle.OnChain,
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

    const [{ loading }, onEnableNotification] = useAsyncFn(async () => {
        try {
            switch (Notification.permission) {
                case 'granted':
                case 'default':
                    await setupFirebaseFcmConnection({ showUi: false });
                    setAgreed(Notification.permission === 'granted');
                    return;
                case 'denied':
                    setupFirebaseFcmConnection();
                    return;
                default:
                    safeUnreachable(Notification.permission);
            }
        } catch (error) {
            enqueueErrorMessage(t`Failed to enable notifications`, { error });
            throw error;
        }
    }, []);

    return (
        <Section>
            <Headline>
                <Trans>Push notifications</Trans>
            </Headline>

            <div className="relative w-full">
                <Subtitle className="leading-6">Your accounts</Subtitle>
                {myAccountConfigs.map((config, index) => (
                    <NotificationConfigItem key={`your-${index}`} {...config} />
                ))}
                <Subtitle className="mt-6 leading-6">Others’ accounts</Subtitle>
                {otherAccountConfigs.map((config, index) => (
                    <NotificationConfigItem key={`other-${index}`} {...config} />
                ))}
                {!agreed || isLoading || isRefetching ? (
                    <div className="absolute inset-0 flex w-full items-center justify-center bg-white/85 backdrop-blur-[1px]">
                        {isLoading || isRefetching ? (
                            <LoadingIcon size={24} />
                        ) : (
                            <ClickableButton
                                className="flex h-10 w-48 items-center justify-center rounded-md bg-main font-bold text-primaryBottom"
                                onClick={onEnableNotification}
                                loading={loading}
                            >
                                Enable notification
                            </ClickableButton>
                        )}
                    </div>
                ) : null}
            </div>
        </Section>
    );
}
