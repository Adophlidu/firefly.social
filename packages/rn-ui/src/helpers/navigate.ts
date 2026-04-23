import { store } from '@/store';
import { navigateAtom } from '@/store/global';
import type { NavigateFunc } from '@/types/ui';

export const navigate: NavigateFunc = (to, options) => {
    const navigateFunc = store.get(navigateAtom)?.navigate;
    if (typeof navigateFunc === 'function') {
        navigateFunc(to, options);
    }
    console.log('Navigate to:', to, options);
};
