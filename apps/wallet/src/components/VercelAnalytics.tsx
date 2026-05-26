'use client';

import { useLocation } from '@tanstack/react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export function VercelAnalytics() {
    const { pathname, search } = useLocation();
    const path = `${pathname}${search}`;

    return (
        <>
            <Analytics path={path} route={pathname} />
            <SpeedInsights route={pathname} />
        </>
    );
}
