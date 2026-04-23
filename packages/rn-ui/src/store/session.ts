import { atom } from 'jotai';

export const sessionTokenAtom = atom<string | null>(null);
export const apiModeAtom = atom<'dev' | 'prod'>('prod');
