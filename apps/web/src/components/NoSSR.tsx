'use client';

import { noSSR } from 'foxact/no-ssr';
import { type ReactNode, Suspense } from 'react';

import { useMounted } from '@/hooks/useMounted.js';

interface NoSSRProps {
    children: ReactNode;
    mode?: 'suspense' | 'mounted';
}

function Inner({ children }: NoSSRProps) {
    noSSR();
    return children;
}

function MountedOnly({ children }: Pick<NoSSRProps, 'children'>) {
    const mounted = useMounted();
    return mounted ? children : null;
}

export function NoSSR({ children, mode = 'suspense' }: NoSSRProps) {
    if (mode === 'mounted') {
        return <MountedOnly>{children}</MountedOnly>;
    }

    return (
        <Suspense>
            <Inner>{children}</Inner>
        </Suspense>
    );
}
