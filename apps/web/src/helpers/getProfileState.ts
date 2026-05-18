import { type ProfileSource, Source } from '@dimensiondev/enums';

import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export function getProfileState(source: ProfileSource) {
    const store = {
        [Source.Farcaster]: useFarcasterProfileStore,
        [Source.Lens]: useLensProfileStore,
        [Source.Twitter]: useTwitterProfileStore,
        [Source.Bsky]: useBskyProfileStore,
        [Source.Firefly]: useFireflyProfileStore,
        [Source.Google]: useThirdPartyProfileStore,
        [Source.Apple]: useThirdPartyProfileStore,
        [Source.Telegram]: useThirdPartyProfileStore,
        [Source.Email]: useThirdPartyProfileStore,
    }[source];

    // throw an error for invalid source
    if (!store) throw new Error(`Failed to get profile state for source: ${source}`);

    return store.getState();
}
