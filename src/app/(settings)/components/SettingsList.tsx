'use client';

import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

import { TextLink } from '@/app/(settings)/components/TextLink.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

interface SettingLink {
    name: ReactNode;
    link: `/${string}`;
    isHidden?: boolean;
    relatedLinks?: Array<`/${string}`>;
}

export function SettingsList() {
    const isLoggedIn = useIsLoginFirefly();

    const settingLinks: SettingLink[] = [
        { name: <Trans>General</Trans>, link: '/general' },
        { name: <Trans>Connected wallets</Trans>, link: '/wallets', isHidden: !isLoggedIn },
        { name: <Trans>Connected accounts</Trans>, link: '/connected', isHidden: !isLoggedIn },
        { name: <Trans>Notifications</Trans>, link: '/notification-settings', isHidden: !isLoggedIn },
        { name: <Trans>Content preference</Trans>, link: '/preference', isHidden: !isLoggedIn },
        {
            name: <Trans>Privacy and security</Trans>,
            link: '/privacy-and-security',
            isHidden: !isLoggedIn,
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
