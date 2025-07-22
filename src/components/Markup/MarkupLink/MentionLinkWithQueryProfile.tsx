import { useQuery } from '@tanstack/react-query';
import type { LinkProps } from 'next/link.js';
import { memo, type ReactNode } from 'react';

import { MentionLink } from '@/components/Markup/MarkupLink/MentionLink.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

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
    const { data: bskyHandle } = useQuery({
        queryKey: ['bsky-handle', handle],
        async queryFn() {
            const didResponse = await bskySessionHolder.agent.resolveHandle({ handle });
            const did = didResponse?.data?.did;
            if (!did) return null;
            return { source: Source.Bsky, profileId: did, handle } as const;
        },
        enabled: !!handle && [Source.Bsky].includes(source),
        retry: false,
        staleTime: 1000 * 60 * 60,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data } = useQuery({
        queryKey: ['profile', source, handle],
        async queryFn() {
            return runInSafeAsync(async () => {
                if (source === Source.Bsky) {
                    const didResponse = await bskySessionHolder.agent.resolveHandle({ handle });
                    const did = didResponse?.data?.did;
                    if (!did) return null;

                    return { source: Source.Bsky, profileId: did, handle } as const;
                }

                return resolveSocialMediaProvider(source).getProfileByIdOrHandle(handle);
            });
        },
        enabled: !!handle && ![Source.Bsky].includes(source),
        retry: false,
        staleTime: 1000 * 60 * 60,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const profile = bskyHandle || data;
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
