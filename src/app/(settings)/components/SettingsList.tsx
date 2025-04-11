'use client';

import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { TextLink } from '@/app/(settings)/components/TextLink.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';

export function SettingsList() {
    const isLoggedIn = useIsLoginFirefly();
    const muteMenuList = useMuteMenuList();

    return (
        <div className="flex min-h-full min-w-full flex-col p-6 md:min-w-[280px] md:border-r md:border-line">
            <div className="hidden pb-6 text-[20px] font-bold leading-[24px] text-lightMain md:block">
                <Trans>Settings</Trans>
            </div>
            {[
                { name: msg`General`, link: '/general' },
                { name: msg`Connected wallets`, link: '/wallets', isHidden: !isLoggedIn },
                { name: msg`Connected accounts`, link: '/connected', isHidden: !isLoggedIn },
                { name: msg`Muted contents`, link: '/mutes', isHidden: !muteMenuList.length },
                { name: msg`Notifications`, link: '/notification-settings', isHidden: !isLoggedIn },
                { name: msg`More`, link: '/more' },
            ].map(({ name, link, isHidden }) => {
                return isHidden ? null : <TextLink key={link} descriptor={name} link={`/settings${link}`} />;
            })}
        </div>
    );
}
