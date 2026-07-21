'use client';

import { memo, useEffect, useState } from 'react';

function readTheme(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const ThemeToggle = memo(function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // The pre-hydration inline script (see layout.tsx) sets html's class from a cookie
    // before React ever runs, so the real theme is only knowable client-side post-mount.
    useEffect(() => {
        setTheme(readTheme());
    }, []);

    return (
        <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-second transition-colors hover:border-fireflyBrand hover:text-main"
            onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark';
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(next);
                document.cookie = `firefly_root_class=${next}; path=/; max-age=31536000`;
                setTheme(next);
            }}
        >
            {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
    );
});
