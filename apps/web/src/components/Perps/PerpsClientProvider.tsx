'use client';

import { createPerpsClient } from '@dimensiondev/perps-core';
import { PerpsClientProvider as HeadlessPerpsClientProvider } from '@dimensiondev/perps-react';
import { type PropsWithChildren, useEffect, useMemo } from 'react';

export function PerpsClientProvider({ children }: PropsWithChildren) {
    const client = useMemo(() => createPerpsClient(), []);

    useEffect(() => {
        return () => {
            void client.close();
        };
    }, [client]);

    return <HeadlessPerpsClientProvider client={client}>{children}</HeadlessPerpsClientProvider>;
}
