import { produce } from 'immer';
import { pickBy } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { type Matcher, patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import type { Profile, ProfileEditable, ProfileLike } from '@/providers/types/SocialMedia.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

function setCurrentProfileInPosts(profile: ProfileLike, params: ProfileEditable) {
    if (!profile) return;
    const matcher: Matcher = (post) => post?.author.profileId === profile.profileId;
    patchPostQueryData(profile.source, matcher, (draft) => {
        if (typeof params.displayName === 'string') draft.author.displayName = params.displayName;
        if (typeof params.bio === 'string') draft.author.bio = params.bio;
        if (typeof params.location === 'string') draft.author.location = params.location;
        if (typeof params.website === 'string') draft.author.website = params.website;
        if (params.pfp) draft.author.pfp = params.pfp;
    });
}

function updateCurrentProfileInState(source: SocialSource, params: ProfileEditable) {
    const stateStore = {
        [Source.Farcaster]: useFarcasterProfileStore,
        [Source.Lens]: useLensProfileStore,
        [Source.Twitter]: useTwitterProfileStore,
        [Source.Bsky]: useBskyProfileStore,
    }[source];
    stateStore.getState().updateCurrentProfile(params);
}

function pickProfileDiff(profile: Profile, profileEditable: ProfileEditable): ProfileEditable {
    return pickBy(profileEditable, (value, key) => value !== profile[key as keyof ProfileEditable]);
}

export async function updateProfile(profile: Profile, profileEditable: ProfileEditable) {
    switch (profile.source) {
        case Source.Farcaster:
            await FarcasterSocialMediaProvider.updateProfile(pickProfileDiff(profile, profileEditable));
            break;
        case Source.Lens:
            await LensSocialMediaProvider.updateProfile(profileEditable);
            break;
        case Source.Twitter:
            await TwitterSocialMediaProxy.updateProfile(profileEditable);
            break;
        case Source.Bsky:
            await BskySocialMediaProvider.updateProfile(pickProfileDiff(profile, profileEditable));
            break;
        default:
            safeUnreachable(profile.source);
    }

    function queryClientUpdater(old?: Profile) {
        if (!old || !isSameProfile(old, profile)) return old;
        return produce(old, (state: Profile) => {
            if (typeof profileEditable.displayName === 'string') state.displayName = profileEditable.displayName;
            if (typeof profileEditable.bio === 'string') state.bio = profileEditable.bio;
            if (typeof profileEditable.location === 'string') state.location = profileEditable.location;
            if (typeof profileEditable.website === 'string') state.website = profileEditable.website;
            state.pfp = profileEditable.pfp ?? getStampAvatarByProfileId(profile.source, profile.profileId);
        });
    }

    queryClient.setQueriesData<Profile>(
        { queryKey: ['profile', profile.source, profile.profileId] },
        queryClientUpdater,
    );
    queryClient.setQueriesData<Profile>({ queryKey: ['profile', profile.source, profile.handle] }, queryClientUpdater);
    setCurrentProfileInPosts(profile, profileEditable);
    updateCurrentProfileInState(profile.source, profileEditable);
    await queryClient.refetchQueries({ queryKey: ['allConnections'] });
}
