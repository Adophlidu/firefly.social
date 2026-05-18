import type { SocialSource } from '@dimensiondev/enums';
import { RestrictionType } from '@dimensiondev/enums';
import { getEnumAsArray } from '@dimensiondev/utils';
import { useMemo } from 'react';

import { isValidRestrictionType } from '@/helpers/isValidRestrictionType.js';

export function useValidRestrictionTypes(sources: SocialSource[]) {
    return useMemo(() => {
        return getEnumAsArray(RestrictionType)
            .filter(({ value }) => isValidRestrictionType(value, sources))
            .map(({ value }) => value);
    }, [sources]);
}
