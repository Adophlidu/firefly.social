import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function useIsLoginFirefly() {
    const { currentProfileSession } = useFireflyProfileStore();
    return !!currentProfileSession;
}
