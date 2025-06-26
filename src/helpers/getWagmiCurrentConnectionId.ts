import { parseJson } from '@/helpers/parseJson.js';

export function getWagmiCurrentConnectionId() {
    const storage = localStorage.getItem('wagmi.store');
    if (!storage) return;

    const wagmiStore = parseJson<{ state: { current: string } }>(storage);

    return wagmiStore?.state?.current;
}
