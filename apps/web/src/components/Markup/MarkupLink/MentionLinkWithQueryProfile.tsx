import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useQueries } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';
import type { LinkProps } from 'next/link.js';
import { memo, type ReactNode } from 'react';

import { MentionLink } from '@/components/Markup/MarkupLink/MentionLink.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { convertBskyHandleToDid } from '@/providers/bsky/convertBskyHandleToDid.js';

interface Props extends Omit<LinkProps, 'href'> {
    handle: string;
    className?: string;
    ref?: React.Ref<HTMLAnchorElement>;
    source: SocialSource;
    fallback?: ReactNode;
}

export const MentionLinkWithQueryProfile = memo<Props>(function MentionLinkWithQueryProfile({
    handle,
    className,
    ref,
    source,
    fallback = null,
    ...rest
}) {
    const profile = useQueries({
        queries: [
            {
                queryKey: ['handle', Source.Bsky, handle],
                async queryFn() {
                    const did = await convertBskyHandleToDid(handle);
                    if (!did) return null;
                    return { source: Source.Bsky, profileId: did, handle } as const;
                },
                enabled: source === Source.Bsky && !!handle,
                staleTime: STALE_TIMES.HOUR_1,
                refetchOnReconnect: false,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
            },
            {
                queryKey: ['profile', source, handle],
                async queryFn() {
                    return resolveSocialMediaProvider(source).getProfileByIdOrHandle(handle);
                },
                enabled: !!handle && source !== Source.Bsky,
                retry: false,
                staleTime: STALE_TIMES.HOUR_1,
                refetchOnReconnect: false,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
            },
        ],
        combine(queries) {
            return first(compact(queries.map((query) => query.data)));
        },
    });
    if (!profile) return fallback;
    return (
        <ProfileTippy
            identity={{
                source,
                id: profile.profileId,
            }}
        >
            <MentionLink handle={profile.handle} href={getProfileUrl(profile)} className="inline-block" {...rest} />
        </ProfileTippy>
    );
});
