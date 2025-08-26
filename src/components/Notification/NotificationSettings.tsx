'use client';

import { Popover, PopoverButton, PopoverPanel, Switch } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import FilterIcon from '@/assets/filter.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { type NotificationSource, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveNotificationIcon } from '@/helpers/resolveNotificationIcon.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';
import { useNotificationStateStore } from '@/store/useNotificationStore.js';

export function NotificationSettings({ source }: { source: NotificationSource }) {
    const { setTypes, setEnableQualityFilter, ...typesState } = useNotificationStateStore();
    const { types: selectedTypes, enableQualityFilter } = typesState[source];

    const asyncStatus = useAsyncStatus(Source.Bsky);

    const {
        data: enabledForBsky,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['bsky-notification-push-switch', asyncStatus],
        staleTime: 1000 * 60 * 3, // 3 minutes
        async queryFn() {
            if (source !== Source.Bsky) return;
            return BskySocialMediaProvider.getNotificationSettings();
        },
    });

    const [{ loading }, onSwitch] = useAsyncFn(
        async (state: boolean) => {
            if (source === Source.Bsky) {
                await BskySocialMediaProvider.setNotificationSettings({
                    priority: state,
                });
                await refetch();
            } else {
                if (source === Source.Farcaster)
                    await FarcasterSocialMediaProvider.setNotificationSettings({
                        priority: state,
                    });
            }
            setEnableQualityFilter(source, state);
        },
        [source, setEnableQualityFilter, refetch],
    );

    const enabledState = source === Source.Bsky ? (enabledForBsky?.priority ?? false) : enableQualityFilter;

    const allTypes = useMemo(() => {
        const baseTypes = [
            {
                Icon: resolveNotificationIcon(NotificationType.Comment),
                text: <Trans>Comment or mention</Trans>,
                types: [NotificationType.Comment, NotificationType.Mention],
            },
            {
                Icon: resolveNotificationIcon(NotificationType.Mirror),
                text: <Trans>Repost or quote</Trans>,
                types: [NotificationType.Mirror, NotificationType.Quote],
            },
            {
                Icon: resolveNotificationIcon(NotificationType.Reaction),
                text: <Trans>Like</Trans>,
                types: [NotificationType.Reaction],
            },
            {
                Icon: resolveNotificationIcon(NotificationType.Follow),
                text: <Trans>Follow</Trans>,
                types: [NotificationType.Follow],
            },
        ];

        return [Source.Farcaster, Source.Bsky].includes(source)
            ? baseTypes
            : [
                  ...baseTypes,
                  {
                      Icon: resolveNotificationIcon(NotificationType.Act),
                      text: <Trans>Collect</Trans>,
                      types: [NotificationType.Act],
                  },
                  ...(source === Source.Notifications
                      ? [
                            {
                                Icon: resolveNotificationIcon(NotificationType.Tips),
                                text: <Trans>Tip</Trans>,
                                types: [NotificationType.Tips],
                            },
                            {
                                Icon: resolveNotificationIcon(NotificationType.Schedule),
                                text: <Trans>Schedule</Trans>,
                                types: [NotificationType.Schedule],
                            },
                        ]
                      : []),
              ];
    }, [source]);

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon className="size-6 shrink-0 text-secondary" width={24} height={24} />
            </PopoverButton>
            <PopoverPanel
                anchor="bottom end"
                className="z-50 flex min-w-[226px] flex-col gap-2 rounded-lg bg-lightBottom p-3 py-3 text-main shadow-lightS3 dark:bg-darkBottom"
            >
                <div className="flex items-center justify-between py-1">
                    <div className="text-sm font-bold leading-[18px]">
                        <Trans>Quality filter</Trans>
                    </div>
                    <Switch
                        disabled={loading || isLoading}
                        checked={enabledState}
                        onChange={onSwitch}
                        className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-lightHighlight dark:bg-bg data-[checked]:dark:bg-lightHighlight"
                    >
                        <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6">
                            {loading || isLoading ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
                        </span>
                    </Switch>
                </div>
                <div className="flex items-center justify-between py-1">
                    <div className="text-sm font-bold leading-[18px]">
                        <Trans>Type filter</Trans>
                    </div>
                </div>

                {allTypes.map(({ Icon, types, text }, index) => {
                    const checked = types.every((type) => selectedTypes.includes(type));

                    return (
                        <div
                            className="flex cursor-pointer items-center justify-between py-1"
                            key={index}
                            onClick={() => {
                                const result = checked
                                    ? selectedTypes.filter((x) => !types.includes(x))
                                    : [...selectedTypes, ...types];

                                setTypes(source, result);
                            }}
                        >
                            <div
                                className={classNames('flex text-sm font-bold leading-[18px]', {
                                    'text-secondary': !selectedTypes.length,
                                })}
                            >
                                {Icon ? <Icon width={20} height={20} /> : null}
                                <span className="ml-2">{text}</span>
                            </div>
                            <CircleCheckboxIcon
                                size={18}
                                checked={checked}
                                className={checked ? 'text-lightHighlight' : undefined}
                            />
                        </div>
                    );
                })}
            </PopoverPanel>
        </Popover>
    );
}
