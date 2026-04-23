import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint';
import type { FireflyResponse } from '@/types/firefly';

export async function createFavorite(name: string) {
    const response = await getFireflyEndpoint().fetchWithSession<FireflyResponse<void>>('/v1/perps/favorites/create', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return resolveFireflyResponseData(response);
}
