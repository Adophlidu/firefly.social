import { atom } from 'jotai';

import type { NavigateFunc, ToastFn } from '@/types/ui';

export const orderBookStepIndexAtom = atom(0);

export const toastAtom = atom<{
    toast: ToastFn;
}>({
    toast: () => {},
});

export const navigateAtom = atom<{
    navigate: NavigateFunc;
}>({
    navigate: () => {},
});
