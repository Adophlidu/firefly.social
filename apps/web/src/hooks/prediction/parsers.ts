import { BetsPriceTimeRange } from '@dimensiondev/enums';
import { createParser } from 'nuqs';

export const parseAsBetsPriceTimeRange = createParser({
    parse(queryValue) {
        const num = Number(queryValue);
        if (!Number.isInteger(num)) return null;
        return Object.values(BetsPriceTimeRange).includes(num) ? (num as BetsPriceTimeRange) : null;
    },
    serialize(value) {
        return String(value);
    },
});
