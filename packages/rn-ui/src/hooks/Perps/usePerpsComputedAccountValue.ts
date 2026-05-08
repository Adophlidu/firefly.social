import { useAtomValue } from 'jotai';

import { perpsComputedAccountValueQueryStateAtom } from '@/store/perpsComputedAccountValue';

export function usePerpsComputedAccountValue() {
    const computedValue = useAtomValue(perpsComputedAccountValueQueryStateAtom);

    return computedValue;
}
