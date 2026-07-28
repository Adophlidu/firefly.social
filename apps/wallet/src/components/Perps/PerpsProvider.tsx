import { createPerpsClient } from '@dimensiondev/perps-core';
import { PerpsClientProvider } from '@dimensiondev/perps-react';
import { type PropsWithChildren, useEffect, useMemo } from 'react';

export function PerpsProvider({ children }: PropsWithChildren) {
    const client = useMemo(() => createPerpsClient(), []);

    useEffect(() => {
        return () => {
            void client.close();
        };
    }, [client]);

    return <PerpsClientProvider client={client}>{children}</PerpsClientProvider>;
}
