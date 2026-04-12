import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { fireflySessionHolder } from '@/providers/fireflySessionHolder';
import type { FireflyResponse } from '@/types/firefly';

export async function getPerpsTokens() {
    const response = await fireflySessionHolder.fetch<
        FireflyResponse<
            Array<{
                name: string;
                category_name: string;
            }>
        >
    >('/v1/perps/token');
    return resolveFireflyResponseData(response);
}
