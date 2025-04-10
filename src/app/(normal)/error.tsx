'use client';

import { usePathname } from '@/esm/navigation.js';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const pathname = usePathname();
    const isProfilePage = isRoutePathname(pathname, '/profile/:source');
    if (isProfilePage) return;
    return <ErrorHandler error={error} reset={reset} />;
}
