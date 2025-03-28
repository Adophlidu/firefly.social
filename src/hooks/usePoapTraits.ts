import dayjs from 'dayjs';
import { useMemo } from 'react';

import { parseUrl } from '@/helpers/parseUrl.js';
import type { NonFungibleTokenTrait } from '@/mask_pkgs/web3-shared/base/index.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';

function findTraitValue(traits: SimpleHash.Attribute[] | NonFungibleTokenTrait[], type: string) {
    return traits.find((trait) => {
        const typeValue = 'trait_type' in trait ? trait.trait_type : trait.type;
        return typeValue === type;
    })?.value;
}

export function usePoapTraits(traits: SimpleHash.Attribute[] | NonFungibleTokenTrait[], dateFormat = 'MMM D, YYYY') {
    return useMemo(() => {
        const startDate = findTraitValue(traits, 'startDate');
        const endDate = findTraitValue(traits, 'endDate');
        const eventURL = findTraitValue(traits, 'eventURL');
        const country = findTraitValue(traits, 'country');
        const city = findTraitValue(traits, 'city');
        const s = startDate ? dayjs(startDate).format(dateFormat) : '';
        const e = endDate ? dayjs(endDate).format(dateFormat) : '';

        return {
            date: s && e ? `${s} - ${e}` : s || e,
            eventURL: parseUrl(eventURL || '') || undefined,
            position: country && city ? `${city}, ${country}` : country || city || undefined,
        };
    }, [traits, dateFormat]);
}
