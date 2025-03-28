import { getNFTPropertyDateString } from '@/helpers/getNFTPropertyDateString.js';
import type { NonFungibleTokenTrait } from '@/mask_pkgs/web3-shared/base/index.js';

export function getNFTPropertyValue(displayType: NonFungibleTokenTrait['displayType'], value: string) {
    switch (displayType) {
        case 'date':
            return getNFTPropertyDateString(value);
        default:
            return value;
    }
}
