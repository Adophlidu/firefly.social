import { compact, first } from 'lodash-es';
import { useMemo } from 'react';

import { Source } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE } from '@/constants/index.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { useAllConnectionsFormattedWithProfiles } from '@/hooks/useAllConnectionsFormattedWithProfiles.js';

export function useFireflyAccountAvatar() {
    const { data } = useAllConnectionsFormattedWithProfiles();

    return useMemo(() => {
        if (data?.fireflyAccount?.avatar && !data?.fireflyAccount.avatar.includes('stamp.firefly.land')) {
            return data?.fireflyAccount.avatar;
        }

        const accountAvatars = compact(
            SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE.flatMap((source) => {
                const result = data?.socialConnections
                    .filter((x) => x.source === source)
                    .flatMap((account) => {
                        const items = account.items;
                        return items.map((item) => ({
                            source,
                            account,
                            profile: item.profile,
                        }));
                    });

                return result ?? EMPTY_LIST;
            }).map(({ profile }) => profile.pfp),
        );

        const socialAvatar = first(accountAvatars);

        if (!socialAvatar && data?.fireflyAccount?.uid)
            return getStampAvatarByProfileId(Source.Firefly, data.fireflyAccount.uid);

        return socialAvatar;
    }, [data]);
}
