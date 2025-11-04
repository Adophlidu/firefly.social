import { useQuery } from '@tanstack/react-query';

import { Link } from '@/components/Link.js';
import { LoadingBase } from '@/components/RedPacket/LoadingBase.js';
import { resolvePlatformProfileUrl } from '@/helpers/resolvePlatformProfile.js';
import { getUserInfoById } from '@/providers/firefly/endpoints/getUserInfoById.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface MentionLinkProps {
    platform: FireflyRedPacketAPI.PlatformType;
    profileId: string;
    handle?: string;
}

export function MentionLink({ platform, profileId, handle }: MentionLinkProps) {
    const isTwitter = platform === FireflyRedPacketAPI.PlatformType.Twitter;
    const isLens = platform === FireflyRedPacketAPI.PlatformType.Lens;
    const { data: twitterHandle, isLoading } = useQuery({
        enabled: isTwitter && !handle,
        queryKey: ['twitter-user-info', profileId],
        queryFn: () => getUserInfoById(profileId),
        select(data) {
            return data?.username;
        },
    });

    const { data: lensHandle } = useQuery({
        enabled: isLens && !handle,
        queryKey: ['lens-user-info', profileId],
        queryFn: () => LensSocialMediaProvider.getProfileById(profileId),
        select(data) {
            return data.handle;
        },
    });

    if (isLoading) return <LoadingBase size={12} width={12} height={12} />;

    const screenName = isTwitter ? twitterHandle || handle : isLens ? lensHandle : handle;
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
            @{screenName}
        </Link>
    );
}
