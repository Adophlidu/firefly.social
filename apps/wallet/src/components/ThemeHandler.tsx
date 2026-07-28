import { useLayoutEffect } from 'react';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

export function ThemeHandler() {
    const isDarkMode = useIsDarkMode();

    useLayoutEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.classList.toggle('light', !isDarkMode);
    }, [isDarkMode]);

    return null;
}
