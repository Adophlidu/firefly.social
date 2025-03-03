import { type ChainAdapter, CoreChainController } from '@reown/appkit';
import { useEffect, useState } from 'react';

import type { ChainNamespace } from '@/types/index.js';

export function useAppKitAllAccounts(): Array<{
    chain: ChainNamespace;
    address: string;
    adapter: ChainAdapter;
}> {
    const [chainState, setChainState] = useState(CoreChainController.state?.chains || new Map());

    useEffect(
        () =>
            CoreChainController.subscribeKey('chains', (chains) => {
                setChainState(chains);
            }),
        [],
    );

    return Array.from(chainState.entries())
        .map(([chain, adapter]) => ({
            chain,
            address: adapter.accountState?.address || '',
            adapter,
        }))
        .filter(({ adapter, address }) => adapter.accountState?.status === 'connected' && !!address);
}
