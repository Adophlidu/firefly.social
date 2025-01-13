import { type SocialSource, Source } from '@/constants/enum.js';
import { SITE_HOSTNAME } from '@/constants/index.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { ProfileIdentifier } from '@/mask/index.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { generateSignaturePacket } from '@/services/generateSignaturePacket.js';

export async function getCurrentClaimProfile(source: SocialSource) {
    const { currentProfile } = getProfileState(source);

    const platform = resolveRedPacketPlatformType(source);

    if (!platform || !currentProfile) return;
    const identifier = ProfileIdentifier.of(SITE_HOSTNAME, currentProfile?.handle).unwrapOr(undefined);

    const profile = platform
        ? ({
              needLensAndFarcasterHandle: true,
              platform,
              profileId: currentProfile?.profileId,
              handle: identifier?.userId,
          } as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'])
        : undefined;

    if (source === Source.Lens)
        return {
            ...profile,
            lensToken: (await lensSessionHolder.sdk.authentication.getAccessToken()).unwrap(),
        } as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'];
    if (source === Source.Farcaster && farcasterSessionHolder.session) {
        const { messageHash, messageSignature, signer } = await generateSignaturePacket();

        return {
            ...profile,
            farcasterMessage: messageHash,
            farcasterSignature: messageSignature,
            farcasterSigner: signer,
        } as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'];
    }

    return profile as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'];
}
