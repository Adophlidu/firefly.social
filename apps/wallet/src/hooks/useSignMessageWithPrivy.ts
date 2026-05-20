import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { useCallback } from 'react';
import type { Address } from 'viem';
import { useConnectors, useSignMessage } from 'wagmi';

export function useSignMessageWithPrivy() {
    const connectors = useConnectors();
    const { mutateAsync } = useSignMessage();

    return useCallback(
        (message: string, account?: Address) =>
            mutateAsync({
                message,
                account,
                connector: connectors.find((c) => c.id === PRIVY_CONNECTOR_ID),
            }),
        [connectors, mutateAsync],
    );
}
