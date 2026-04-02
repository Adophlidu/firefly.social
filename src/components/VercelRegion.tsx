'use client';

import { useEffect } from 'react';

function getCookieValue(name: string): string | null {
    const pair = document.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return null;
    return decodeURIComponent(pair.split('=')[1]);
}

export function VercelRegion() {
    useEffect(() => {
        (window as any).VERCEL_IP_TIMEZONE = getCookieValue('__ff_geo_tz');
        (window as any).VERCEL_IP_CITY = getCookieValue('__ff_geo_city');
        (window as any).VERCEL_IP_COUNTRY = getCookieValue('__ff_geo_country');
        (window as any).VERCEL_IP_REGION = getCookieValue('__ff_geo_region');
    }, []);

    return null;
}
