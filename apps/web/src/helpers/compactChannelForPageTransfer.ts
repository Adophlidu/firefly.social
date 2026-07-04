import type { Channel, Profile } from '@/providers/types/SocialMedia.js';

function compactProfileForChannel(profile: Profile): Profile {
    return {
        ...profile,
        bio: undefined,
        bioContext: undefined,
    };
}

/** Drop heavy nested fields before passing channel data through the RSC client boundary. */
export function compactChannelForPageTransfer(channel: Channel): Channel {
    return {
        ...channel,
        lead: channel.lead ? compactProfileForChannel(channel.lead) : undefined,
        hosts: channel.hosts?.map(compactProfileForChannel),
    };
}
