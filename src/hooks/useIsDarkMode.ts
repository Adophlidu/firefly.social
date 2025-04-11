import { isServer } from '@tanstack/react-query';
import { useMediaQuery } from 'usehooks-ts';

import { SiteCookies } from '@/constants/enum.js';
import { useCookie } from '@/helpers/getCookies.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

export function useIsDarkMode() {
    const rootClass = useCookie(SiteCookies.FireflyRootClass);
    const isDarkOS = useMediaQuery('(prefers-color-scheme: dark)');
    const themeMode = useThemeModeStore.use.themeMode();
    return isServer ? rootClass === 'dark' : themeMode === 'dark' || (themeMode === 'default' && isDarkOS);
}
