import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint';
import type { FireflyResponse } from '@/types/firefly';

export async function getPerpsCategories() {
    const response = await getFireflyEndpoint().fetch<
        FireflyResponse<
            Array<{
                name: string;
                display_name: string;
            }>
        >
    >('/v1/perps/category');
    return resolveFireflyResponseData(response);
}
