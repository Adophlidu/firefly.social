'use client';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { ExceptionId } from '@/providers/errorCapture/captureException.js';
import { useReportErrorOnce } from '@/providers/errorCapture/useReportErrorOnce.js';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const pathname = usePathname();

    useReportErrorOnce(error, {
        exceptionId: ExceptionId.UI_CRASH,
        tags: { handler: 'error.tsx', pathname: pathname ?? '' },
    });

    const isProfilePage = isRoutePathname(pathname, '/profile/:source');
    if (isProfilePage) return null;

    return <ErrorHandler error={error} reset={reset} />;
}
