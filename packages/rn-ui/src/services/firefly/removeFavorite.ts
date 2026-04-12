import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { fireflySessionHolder } from '@/providers/fireflySessionHolder';
import type { FireflyResponse } from '@/types/firefly';

export async function removeFavorite(name: string) {
    const response = await fireflySessionHolder.fetchWithSession<FireflyResponse<void>>('/v1/perps/favorites/remove', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return resolveFireflyResponseData(response);
}
