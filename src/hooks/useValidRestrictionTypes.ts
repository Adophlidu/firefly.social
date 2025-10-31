import { getEnumAsArray } from '@firefly/utils';
import { useMemo } from 'react';

import { RestrictionType, type SocialSource } from '@/constants/enum.js';
import { isValidRestrictionType } from '@/helpers/isValidRestrictionType.js';

export function useValidRestrictionTypes(sources: SocialSource[]) {
    return useMemo(() => {
        return getEnumAsArray(RestrictionType)
            .filter(({ value }) => isValidRestrictionType(value, sources))
            .map(({ value }) => value);
    }, [sources]);
}
