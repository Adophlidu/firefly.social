import { parseUrl } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { type EVM as NFTScanEVM } from '@/providers/nftscan/types.js';
import { type NonFungibleTokenTrait } from '@/web3-shared/base/specs.js';

function findTraitValue(traits: NFTScanEVM.Attribute[] | NonFungibleTokenTrait[], type: string) {
    const trait = traits.find((trait) => {
        const typeValue = 'attribute_name' in trait ? trait.attribute_name : trait.type;
        return typeValue === type;
    });
    if (!trait) return;
    return 'attribute_name' in trait ? trait.attribute_value : trait.value;
}

export function usePoapTraits(traits: NFTScanEVM.Attribute[] | NonFungibleTokenTrait[], dateFormat = 'MMM D, YYYY') {
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
