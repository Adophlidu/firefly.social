'use client';

import FilterIcon from '@dimensiondev/assets/filter.svg';
import { Source } from '@dimensiondev/enums';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import { Switch } from '@/components/Switch/index.js';
import { TypeFilter } from '@/components/TypeFilter/index.js';
import { UNIFIED_NOTIFICATION_TYPES } from '@/constants/computed.js';
import type { NotificationSource } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { getBskyNotificationSettings } from '@/providers/bsky/getBskyNotificationSettings.js';
import { setBskyNotificationSettings } from '@/providers/bsky/setBskyNotificationSettings.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { captureQualityFilterOffEvent } from '@/providers/telemetry/captureFilterTabEvent.js';
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
        staleTime: STALE_TIMES.MINUTE_3,

        enabled: source === Source.Bsky,
        queryFn: () => getBskyNotificationSettings(),
    });

    const [{ loading: switching }, onSwitch] = useAsyncFn(
        async (state: boolean) => {
            if (source === Source.Bsky) {
                await setBskyNotificationSettings({
                    priority: state,
                });
                await refetch();
            } else {
                if (source === Source.Farcaster)
                    await farcasterSocialMediaProvider.setNotificationSettings({
                        priority: state,
                    });
            }
            setEnableQualityFilter(source, state);
            if (!state) captureQualityFilterOffEvent();
        },
        [source, setEnableQualityFilter, refetch],
    );

    const enabledState = source === Source.Bsky ? (enabledForBsky?.priority ?? false) : enableQualityFilter;

    const menuItems = useMemo(() => {
        const baseItems = [
            {
                type: NotificationType.Comment,
                text: <Trans>Comment or mention</Trans>,
                types: [NotificationType.Comment, NotificationType.Mention],
            },
            {
                type: NotificationType.Mirror,
                text: <Trans>Repost or quote</Trans>,
                types: [NotificationType.Mirror, NotificationType.Quote],
            },
            {
                type: NotificationType.Reaction,
                text: <Trans id="action-like">Like</Trans>,
                types: [NotificationType.Reaction, ...UNIFIED_NOTIFICATION_TYPES],
            },
            {
                type: NotificationType.Follow,
                text: <Trans>Follow</Trans>,
                types: [NotificationType.Follow],
            },
        ];

        return [Source.Farcaster, Source.Bsky, Source.Twitter].includes(source)
            ? baseItems
            : [
                  ...baseItems,
                  {
                      type: NotificationType.Act,
                      text: <Trans>Collect</Trans>,
                      types: [NotificationType.Act],
                  },
                  ...(source === Source.Notifications
                      ? [
                            {
                                type: NotificationType.Tips,
                                text: <Trans>Tip</Trans>,
                                types: [NotificationType.Tips],
                            },
                            {
                                type: NotificationType.Schedule,
                                text: <Trans>Schedule</Trans>,
                                types: [NotificationType.Schedule],
                            },
                        ]
                      : []),
              ];
    }, [source]);

    const filterOptions = useMemo(() => {
        return menuItems.map((type) => ({
            value: type.type,
            label: type.text,
        }));
    }, [menuItems]);

    const selectedOptions = useMemo(() => {
        return menuItems
            .filter((item) => item.types.every((type) => selectedTypes.includes(type)))
            .map((item) => item.type);
    }, [selectedTypes, menuItems]);

    const handleOptionsChange = useCallback(
        (options: string[]) => {
            const selectedTypes = menuItems.filter((item) => options.includes(item.type)).flatMap((item) => item.types);
            setTypes(source, selectedTypes);
        },
        [menuItems, setTypes, source],
    );
    const loading = switching || isLoading;

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2 outline-none">
                <FilterIcon className="text-secondary size-6 shrink-0" width={24} height={24} />
            </PopoverButton>
            <PopoverPanel className="bg-lightBottom text-main shadow-lightS3 dark:bg-darkBottom absolute right-0 top-10 z-50 flex min-w-[320px] flex-col gap-2 rounded-lg">
                <div className={'flex flex-col gap-4 p-4'}>
                    {source !== Source.Twitter ? (
                        <div className="flex justify-between">
                            <span className="text-sm font-semibold">
                                <Trans>Quality filter</Trans>
                            </span>
                            <Switch
                                checked={enabledState}
                                loading={loading}
                                disabled={loading}
                                onChange={onSwitch}
                                size="small"
                            />
                        </div>
                    ) : null}
                    <TypeFilter
                        multiple
                        options={filterOptions}
                        selectedOptions={selectedOptions}
                        onOptionsChange={handleOptionsChange}
                    />
                </div>
            </PopoverPanel>
        </Popover>
    );
}
