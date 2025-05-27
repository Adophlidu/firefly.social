import { type ProfileSource, Source } from '@/constants/enum.js';
import {
    useBskyStateStore,
    useFarcasterStateStore,
    useFireflyStateStore,
    useLensStateStore,
    useThirdPartyStateStore,
    useTwitterStateStore,
} from '@/store/useProfileStore.js';

export function getProfileState(source: ProfileSource) {
    const store = {
        [Source.Farcaster]: useFarcasterStateStore,
        [Source.Lens]: useLensStateStore,
        [Source.Twitter]: useTwitterStateStore,
        [Source.Bsky]: useBskyStateStore,
        [Source.Firefly]: useFireflyStateStore,
        [Source.Google]: useThirdPartyStateStore,
        [Source.Apple]: useThirdPartyStateStore,
        [Source.Telegram]: useThirdPartyStateStore,
        [Source.Email]: useThirdPartyStateStore,
    }[source];

    // throw an error for invalid source
    if (!store) throw new Error(`Failed to get profile state for source: ${source}`);

    return store.getState();
}
