import { useEffect } from 'react';

import { useRouter } from '@/esm/navigation.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { SettingsList } from '@/legacy/[locale]/(settings)/components/SettingsList.js';

export default function Settings() {
    const router = useRouter();
    const isDesktop = useIsLarge();

    useEffect(() => {
        if (isDesktop) router.replace('/settings/general');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop]);

    if (isDesktop) return null;

    // mobile
    return (
        <main className="flex w-full">
            <SettingsList />
        </main>
    );
}
