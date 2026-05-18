import { Source } from '@dimensiondev/enums';
import { compact, first } from 'lodash-es';
import { useMemo } from 'react';

import { SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE } from '@/constants/computed.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import type {
    BskyConnection,
    FarcasterConnection,
    LensConnection,
    TwitterConnection,
} from '@/providers/types/Firefly.js';

export function useFireflyAccountAvatar() {
    const { data } = useAllConnections();

    return useMemo(() => {
        if (data?.fireflyAccount?.avatar && !data?.fireflyAccount.avatar.includes('stamp.firefly.land')) {
            return data?.fireflyAccount.avatar;
        }

        const accountAvatars = compact(
            SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE.map((source) => {
                const connections =
                    source === Source.Lens
                        ? data?.social.Lens.connected.flatMap((x) => x.lens)
                        : (data?.social[source].connected.sort((a, b) =>
                              b.isDefault === a.isDefault ? 0 : b.isDefault ? -1 : 1,
                          ) as Array<FarcasterConnection | BskyConnection | TwitterConnection | LensConnection>);
                if (!connections) return null;
                const connection = first(connections);
                if (!connection) return null;
                return getStampAvatarByProfileId(source, `${connection.id}`);
            }),
        );

        const socialAvatar = first(accountAvatars);

        if (!socialAvatar && data?.fireflyAccount?.uid)
            return getStampAvatarByProfileId(Source.Firefly, data.fireflyAccount.uid);

        return socialAvatar;
    }, [data]);
}
