import { useQuery } from '@tanstack/react-query';
import { sortBy } from 'lodash-es';
import { memo, useMemo } from 'react';
import { normalize } from 'viem/ens';
import { useEnsAvatar, useEnsName } from 'wagmi';

import XFillIcon from '@/assets/x-fill.svg';
import { Source } from '@/constants/enum.js';
import { EMBED_CARD_SOURCE_PRIORITY, EMPTY_LIST } from '@/constants/index.js';
import { Image } from '@/esm/Image.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { FarcasterProfile, WalletProfile } from '@/providers/types/Firefly.js';

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
    const fallbackAvatar = `https://stamp.firefly.land/avatar/wallet/${address}?s=${size}`;
    const { data: ens } = useEnsName({
        address: address as `0x${string}`,
    });
    const { data: ensAvatar } = useEnsAvatar({
        name: ens ? normalize(ens) : undefined,
    });
    const avatar = useMemo(() => {
        const sorted = sortBy(profiles, (x) => {
            const index = EMBED_CARD_SOURCE_PRIORITY.indexOf(x.identity.source);
            if (x.identity.source === Source.Wallet && isSameAddress(x.identity.id, address))
                return EMBED_CARD_SOURCE_PRIORITY.length;
            return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        });
        for (const profile of sorted) {
            switch (profile.identity.source) {
                case Source.Farcaster:
                    return {
                        source: Source.Farcaster,
                        url: (profile.__origin__ as FarcasterProfile | null)?.avatar.url,
                    };
                case Source.Lens:
                    return {
                        source: Source.Lens,
                        url: null, // Would fetch below
                    };
                case Source.Twitter:
                    return {
                        source: Source.Twitter,
                        url: null,
                    };
                case Source.Wallet:
                    return { source: Source.Wallet, url: ensAvatar || (profile.__origin__ as WalletProfile)?.avatar };
            }
        }
        return { source: Source.Wallet, url: fallbackAvatar };
    }, [profiles, fallbackAvatar, address, ensAvatar]);

    const { data: lensAvatar } = useQuery({
        enabled: avatar?.source === Source.Lens,
        queryKey: ['lens', 'avatar', address],
        queryFn: async () => {
            const profiles = await LensSocialMediaProvider.getProfilesByAddress(address);
            return profiles.find((x) => x.pfp)?.pfp;
        },
    });

    if (avatar.source === Source.Twitter) return <XFillIcon className={className} width={size} height={size} />;

    const url = avatar.url || lensAvatar || fallbackAvatar;
    return <Image className={className} unoptimized loading="lazy" src={url} alt="" width={size} height={size} />;
});
