'use client';

import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { TextLink } from '@/app/[locale]/(settings)/components/TextLink.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

interface SettingLink {
    name: ReactNode;
    link: `/${string}`;
    isHidden?: boolean;
    relatedLinks?: Array<`/${string}`>;
}

export function SettingsList() {
    const isLogin = useIsLoginFirefly();

    const settingLinks: SettingLink[] = [
        { name: <Trans>General</Trans>, link: '/general' },
        { name: <Trans>Connected wallets</Trans>, link: '/wallets', isHidden: !isLogin },
        { name: <Trans>Connected accounts</Trans>, link: '/connected', isHidden: !isLogin },
        { name: <Trans>Notifications</Trans>, link: '/notification-settings', isHidden: !isLogin },
        { name: <Trans>Content preference</Trans>, link: '/preference', isHidden: !isLogin },
        {
            name: <Trans>Privacy and security</Trans>,
            link: '/privacy-and-security',
            isHidden: !isLogin,
            relatedLinks: ['/settings/mutes'],
        },
        { name: <Trans>More</Trans>, link: '/more' },
    ];

    return (
        <div className="flex min-h-full min-w-full flex-col p-6 lg:min-w-[280px] lg:border-r lg:border-line">
            <div className="hidden pb-6 text-[20px] font-bold leading-6 text-lightMain lg:block">
                <Trans>Settings</Trans>
            </div>
            {settingLinks.map(({ name, link, isHidden, relatedLinks }) => {
                return isHidden ? null : (
                    <TextLink key={link} name={name} link={`/settings${link}`} relatedLinks={relatedLinks} />
                );
            })}
        </div>
    );
}
