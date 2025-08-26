import { getNFTPropertyDateString } from '@/helpers/getNFTPropertyDateString.js';
import type { NonFungibleTokenTrait } from '@/web3-shared/base/specs.js';

export function getNFTPropertyValue(displayType: NonFungibleTokenTrait['displayType'], value: string) {
    switch (displayType) {
        case 'date':
            return getNFTPropertyDateString(value);
        default:
            return value;
    }
}
