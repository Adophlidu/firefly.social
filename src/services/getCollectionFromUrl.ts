import { EVM_ADDRESS } from '@/constants/regexp.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export async function getCollectionFromUrl(url: string) {
    const match = url.match(EVM_ADDRESS);
    const address = match?.[0];
    if (!address) return null;
    return FireflyEndpointProvider.detectCollection(address);
}
