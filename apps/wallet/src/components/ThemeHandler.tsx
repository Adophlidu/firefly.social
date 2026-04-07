import { useLayoutEffect } from 'react';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

export function ThemeHandler() {
    const isDarkMode = useIsDarkMode();

    useLayoutEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return null;
}
