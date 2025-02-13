'use client';

import { Popover, PopoverButton, PopoverPanel, Switch } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import SettingsIcon from '@/assets/setting.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useNotificationSettings } from '@/hooks/useNotificationSettings.js';

export function NotificationSettings({ source }: { source: SocialSource }) {
    const { enabled, isLoading, refetch } = useNotificationSettings(source);
    const [{ loading }, onSwitch] = useAsyncFn(
        async (state: boolean) => {
            const result = await resolveSocialMediaProvider(source).setNotificationSettings({
                priority: state,
            });
            if (!result) throw new Error('Failed to update notification settings');

            await refetch();
            queryClient.refetchQueries({ queryKey: ['notifications', source] });
        },
        [refetch, source],
    );

    if (source === Source.Twitter) return null;

    return (
        <Popover className="relative flex items-center justify-center">
            <PopoverButton className="p-2">
                <SettingsIcon className="h-5 w-5 shrink-0" width={20} height={20} />
            </PopoverButton>
            <PopoverPanel
                anchor="bottom end"
                className="z-50 flex flex-col rounded-lg bg-lightBottom p-3 text-main shadow-lightS3 dark:bg-darkBottom"
            >
                <div className="flex items-center">
                    <div className="mr-3 text-sm font-bold leading-[18px]">
                        {
                            {
                                [Source.Farcaster]: <Trans>Quality Filter</Trans>,
                                [Source.Lens]: <Trans>Quality Filter</Trans>,
                                [Source.Bsky]: <Trans>Enable priority notifications</Trans>,
                            }[source]
                        }
                    </div>
                    <Switch
                        disabled={isLoading || loading}
                        checked={enabled}
                        onChange={onSwitch}
                        className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-lightHighlight dark:bg-bg data-[checked]:dark:bg-lightHighlight"
                    >
                        <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6">
                            {loading || isLoading ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
                        </span>
                    </Switch>
                </div>
            </PopoverPanel>
        </Popover>
    );
}
