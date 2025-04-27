'use client';

import { noSSR } from 'foxact/no-ssr';
import { Suspense } from 'react';

interface NoSSRProps {
    children: React.ReactNode;
}

function Inner({ children }: NoSSRProps) {
    noSSR();
    return children;
}
export function NoSSR({ children }: NoSSRProps) {
    return (
        <Suspense>
            <Inner>{children}</Inner>
        </Suspense>
    );
}
