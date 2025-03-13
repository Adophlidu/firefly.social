import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { normalize } from 'viem/ens';
import { useEnsAvatar, useEnsName } from 'wagmi';

import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { Image } from '@/esm/Image.js';
import { getLargeTwitterAvatar } from '@/helpers/getLargeTwitterAvatar.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { FarcasterProfile } from '@/providers/types/Firefly.js';

interface AddressSocialAvatarProps {
    address: string;
    size?: number;
    className?: string;
}

/**
 * by priority: {@link EMBED_CARD_SOURCE_PRIORITY}
 */
export const AddressSocialAvatar = memo<AddressSocialAvatarProps>(function AddressSocialAvatar({
    address,
    size,
    className,
}) {
    const { data: profiles = EMPTY_LIST } = useWalletRelatedProfiles(address);
    const { data: ens } = useEnsName({
        address: address as `0x${string}`,
    });
    const { data: ensAvatar } = useEnsAvatar({
        name: ens ? normalize(ens) : undefined,
    });
    const twitterProfile = profiles.find((x) => x.identity.source === Source.Twitter);
    const twitterProfileId = twitterProfile?.identity.id;
    const farcasterProfile = profiles.find((x) => x.identity.source === Source.Farcaster);

    const { data: twitterAvatar } = useQuery({
        enabled: !ensAvatar,
        queryKey: ['twitter', 'avatar', twitterProfileId],
        queryFn: async () => {
            if (!twitterProfileId) return null;
            const profile = await resolveSocialMediaProvider(Source.Twitter).getProfileByIdOrHandle(twitterProfileId);
            return getLargeTwitterAvatar(profile.pfp);
        },
    });

    const { data: lensAvatar } = useQuery({
        enabled: !farcasterProfile && !twitterProfile && !ensAvatar,
        queryKey: ['lens', 'avatar', address],
        queryFn: async () => {
            const profiles = await LensSocialMediaProvider.getProfilesByAddress(address);
            return profiles.find((x) => x.pfp)?.pfp;
        },
    });

    const url =
        ensAvatar ||
        twitterAvatar ||
        (farcasterProfile?.__origin__ as FarcasterProfile | null)?.avatar.url ||
        lensAvatar ||
        getStampAvatarByProfileId(Source.Wallet, address);

    return <Image className={className} unoptimized loading="lazy" src={url} alt="" width={size} height={size} />;
});
