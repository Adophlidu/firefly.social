'use client';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useReportErrorOnce } from '@/hooks/useReportErrorOnce.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const pathname = usePathname();
    const isProfilePage = isRoutePathname(pathname, '/profile/:source');

    useReportErrorOnce(error, {
        tags: { handler: 'error.tsx', pathname: pathname ?? '' },
    });

    if (isProfilePage) return null;
    return <ErrorHandler error={error} reset={reset} />;
}
