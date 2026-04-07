import { useAtomValue } from 'jotai';

import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

export function useIsLoginFirefly() {
    const token = useAtomValue(fireflySessionTokenAtom);
    return !!token;
}
