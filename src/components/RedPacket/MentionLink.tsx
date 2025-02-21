import { useQuery } from '@tanstack/react-query';

import { Link } from '@/components/Link.js';
import { resolvePlatformProfileUrl } from '@/helpers/resolvePlatformProfile.js';
import { LoadingBase } from '@/mask/components.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface MentionLinkProps {
    platform: FireflyRedPacketAPI.PlatformType;
    profileId: string;
    handle?: string;
}

export function MentionLink({ platform, profileId, handle }: MentionLinkProps) {
    const isTwitter = platform === FireflyRedPacketAPI.PlatformType.Twitter;
    const { data: twitterHandle, isLoading } = useQuery({
        enabled: isTwitter && !handle,
        queryKey: ['twitter-user-info', profileId],
        queryFn: () => FireflyEndpointProvider.getUserInfoById(profileId),
        select(data) {
            return data?.username;
        },
    });

    if (isLoading) return <LoadingBase size={12} width={12} height={12} />;

    const screenName = isTwitter ? twitterHandle || handle : handle;
    if (!screenName) return <span>the creator</span>;

    return (
        <Link
            href={resolvePlatformProfileUrl(
                platform,
                platform === FireflyRedPacketAPI.PlatformType.Farcaster ? profileId : screenName,
            )}
            target="_blank"
            className="text-base leading-[18px] text-highlight"
        >
            @{isTwitter ? twitterHandle || handle : handle}
        </Link>
    );
}
