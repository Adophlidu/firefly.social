import { atomWithStorage, createJSONStorage } from 'jotai/utils';

export const routeChangedAtom = atomWithStorage(
    'routeChanged',
    false,
    typeof window !== 'undefined' ? createJSONStorage(() => sessionStorage) : undefined,
);
