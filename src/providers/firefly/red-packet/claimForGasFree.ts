import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function claimForGasFree(
    rpid: string,
    address: string,
    profile: (
        | {
              platform: FireflyRedPacketAPI.PlatformType.Farcaster;
              profileId: string;
              farcasterSignature: string;
              farcasterSigner: string;
              farcasterMessage: string;
          }
        | {
              platform: FireflyRedPacketAPI.PlatformType.Lens;
              profileId: string;
              lensToken?: string;
          }
        | {
              platform: FireflyRedPacketAPI.PlatformType.Twitter;
              profileId: string;
          }
        | {
              platform: FireflyRedPacketAPI.PlatformType.Bsky;
              profileId: string;
          }
    ) & {
        needLensAndFarcasterHandle: boolean;
        handle?: string;
    },
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/gasFreeClaimRedPacket');
    const { data } = await fireflySessionHolder.fetchWithSession<
        FireflyRedPacketAPI.Response<{
            hash: string;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            rpid,
            wallet: {
                address,
            },
            profile,
        }),
    });
    return data.hash;
}
