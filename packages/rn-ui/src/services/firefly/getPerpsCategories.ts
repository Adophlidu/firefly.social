import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { fireflySessionHolder } from '@/providers/fireflySessionHolder';
import { type FireflyResponse } from '@/types/firefly';

export async function getPerpsCategories() {
    const response = await fireflySessionHolder.fetch<
        FireflyResponse<
            Array<{
                name: string;
                display_name: string;
            }>
        >
    >('/v1/perps/category');
    return resolveFireflyResponseData(response);
}
