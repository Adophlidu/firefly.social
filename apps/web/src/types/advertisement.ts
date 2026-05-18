import type { AdFunctionType, AdvertisementType } from '@dimensiondev/enums';

export interface Advertisement {
    sort: number;
    image: string;
    link: string;
    type: AdvertisementType;
    function?: AdFunctionType;
}
