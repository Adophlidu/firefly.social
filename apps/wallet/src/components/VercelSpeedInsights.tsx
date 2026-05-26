'use client';

import { useLocation } from '@tanstack/react-router';
import { SpeedInsights } from '@vercel/speed-insights/react';

export function VercelSpeedInsights() {
    const { pathname } = useLocation();

    return <SpeedInsights route={pathname} />;
}
