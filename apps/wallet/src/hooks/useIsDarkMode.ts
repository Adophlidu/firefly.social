import { isServer } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useMediaQuery } from 'usehooks-ts';

import { SiteCookies } from '@/constants/enum.js';
import { useCookie } from '@/helpers/getCookies.js';
import { themeStorageAtom } from '@/store/theme.js';

export function useIsDarkMode() {
    const rootClass = useCookie(SiteCookies.FireflyRootClass);
    const isDarkOS = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = useAtomValue(themeStorageAtom);
    const themeMode = theme?.state.themeMode ?? 'default';
    return isServer ? rootClass === 'dark' : themeMode === 'dark' || (themeMode === 'default' && isDarkOS);
}
