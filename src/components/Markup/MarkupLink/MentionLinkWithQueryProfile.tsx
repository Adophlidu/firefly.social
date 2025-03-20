import { useQuery } from '@tanstack/react-query';
import type { LinkProps } from 'next/link.js';
import { memo, type ReactNode } from 'react';

import { MentionLink } from '@/components/Markup/MarkupLink/MentionLink.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { type SocialSource } from '@/constants/enum.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

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
    const { data: profile } = useQuery({
        queryKey: ['profile', source, handle],
        queryFn() {
            return resolveSocialMediaProvider(source).getProfileByIdOrHandle(handle);
        },
        enabled: !!handle,
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
