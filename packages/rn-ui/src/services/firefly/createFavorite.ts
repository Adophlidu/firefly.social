import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { fireflySessionHolder } from '@/providers/fireflySessionHolder';
import { type FireflyResponse } from '@/types/firefly';

export async function createFavorite(name: string) {
    const response = await fireflySessionHolder.fetchWithSession<FireflyResponse<void>>('/v1/perps/favorites/create', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return resolveFireflyResponseData(response);
}
