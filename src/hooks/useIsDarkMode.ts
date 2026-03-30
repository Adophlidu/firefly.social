import { isServer } from '@tanstack/react-query';
import { useMediaQuery } from 'usehooks-ts';

import { SiteCookies } from '@/constants/enum.js';
import { useCookie } from '@/helpers/getCookies.js';
import { useMounted } from '@/hooks/useMounted.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

export function useIsDarkMode() {
    const rootClass = useCookie(SiteCookies.FireflyRootClass);
    const isDarkOS = useMediaQuery('(prefers-color-scheme: dark)', { initializeWithValue: false });
    const themeMode = useThemeModeStore.use.themeMode();
    const mounted = useMounted();

    // During SSR and initial client render (hydration), use the cookie value — same as server.
    // This prevents hydration mismatch when the cookie and the Zustand/OS state disagree.
    if (isServer || !mounted) return rootClass === 'dark';

    return themeMode === 'dark' || (themeMode === 'default' && isDarkOS);
}
