'use client';

import { memo, type ReactNode, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

interface RE {
    r: string;
    flags?: string;
}

interface IfPathname {
    exact?: boolean;
    isOneOf?: Array<PageRoute | `/${string}` | RE>;
    isNotOneOf?: Array<PageRoute | `/${string}` | RE>;
    children: ReactNode;
    otherwise?: ReactNode;
}

export const IfPathname = memo(function IfPathname({
    exact = false,
    isOneOf,
    isNotOneOf,
    children,
    otherwise = null,
}: IfPathname) {
    const pathname = usePathname();
    const [lastPathname, setLastPathname] = useState(
        !isRoutePathname(pathname, '/post/:detail/photos/:index', true) ? pathname : '',
    );

    useUpdateEffect(() => {
        if (isRoutePathname(pathname, '/post/:detail/photos/:index', true)) return;

        setLastPathname(pathname);
    }, [pathname]);

    if (
        isOneOf?.some((includedPath) =>
            typeof includedPath === 'string'
                ? isRoutePathname(lastPathname, includedPath, exact)
                : new RegExp(includedPath.r, includedPath.flags).test(lastPathname),
        )
    ) {
        return <>{children}</>;
    }

    if (
        isNotOneOf &&
        !isNotOneOf.some((excludedPath) =>
            typeof excludedPath === 'string'
                ? isRoutePathname(lastPathname, excludedPath, exact)
                : new RegExp(excludedPath.r, excludedPath.flags).test(lastPathname),
        )
    ) {
        return <>{children}</>;
    }

    return otherwise;
});
