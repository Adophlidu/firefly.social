import { compact, first } from 'lodash-es';
import { useMemo } from 'react';

import { Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE } from '@/constants/index.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';

export function useCurrentFireflyAccountAvatar(uid?: string, defaultAvatar?: string | null) {
    const profileStore = useProfileStoreAll();
    return useMemo(() => {
        if (defaultAvatar && !defaultAvatar.includes('stamp.firefly.land')) {
            return defaultAvatar;
        }
        const accountAvatars = compact(
            SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE.flatMap((source) => {
                return profileStore[source].accounts.map((account) => ({
                    source,
                    account,
                    profile: account.profile,
                }));
            }).map(({ profile }) => profile.pfp),
        );

        const socialAvatar = first(accountAvatars);

        if (!socialAvatar && uid) return getStampAvatarByProfileId(Source.Firefly, uid);

        return socialAvatar;
    }, [defaultAvatar, profileStore, uid]);
}
