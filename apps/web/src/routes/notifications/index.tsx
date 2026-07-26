'use client';

import { DEFAULT_NOTIFICATION_SOURCE } from '@dimensiondev/constants/computed';
import { useEffect } from 'react';

import { useRouter } from '@/esm/navigation.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';

export default function Page() {
    const router = useRouter();
    useEffect(() => {
        router.replace(resolveNotificationUrl(DEFAULT_NOTIFICATION_SOURCE));
    }, [router]);
    return null;
}
