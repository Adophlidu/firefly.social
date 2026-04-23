import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint';
import type { FireflyResponse } from '@/types/firefly';

export async function getPerpsTokens() {
    const response = await getFireflyEndpoint().fetch<
        FireflyResponse<
            Array<{
                name: string;
                category_name: string;
            }>
        >
    >('/v1/perps/token');
    return resolveFireflyResponseData(response);
}
