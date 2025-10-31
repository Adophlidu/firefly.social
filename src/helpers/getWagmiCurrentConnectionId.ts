import { parseJson } from '@dimensiondev/utils';

export function getWagmiCurrentConnectionId() {
    const storage = localStorage.getItem('wagmi.store');
    if (!storage) return;

    const wagmiStore = parseJson<{ state: { current: string } }>(storage);

    return wagmiStore?.state?.current;
}
