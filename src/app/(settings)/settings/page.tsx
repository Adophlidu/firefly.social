'use client';

import { msg } from '@lingui/core/macro';
import { useEffect } from 'react';

import { SettingsList } from '@/app/(settings)/components/SettingsList.js';
import { useRouter } from '@/esm/navigation.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';

export default function Settings() {
    const router = useRouter();
    const isMedium = useIsMedium();

    useNavigatorTitle(msg`Settings`);

    useEffect(() => {
        if (isMedium) router.replace('/settings/general');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMedium]);

    if (isMedium) return null;

    // mobile
    return (
        <main className="flex-grow-1 flex w-full">
            <SettingsList />
        </main>
    );
}
