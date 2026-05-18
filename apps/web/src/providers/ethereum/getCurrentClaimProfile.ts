import { Source } from '@dimensiondev/enums';
import type { SocialSource } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { generateSignaturePacket } from '@/services/generateSignaturePacket.js';

export async function getCurrentClaimProfile(source: SocialSource) {
    const platform = resolveRedPacketPlatformType(source);
    const currentProfile = getCurrentProfileFromStorage(source);

    if (!platform || !currentProfile) return;

    const profile = platform
        ? ({
              needLensAndFarcasterHandle: true,
              platform,
              profileId: currentProfile?.profileId,
              handle: currentProfile.handle,
          } as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'])
        : undefined;

    if (source === Source.Lens) {
        const credentials = ensureLensResultSync(lensSessionClientHolder.sessionClient.getCredentials());
        if (!credentials) throw new Error('No lens credentials found');

        return {
            ...profile,
            lensToken: credentials.accessToken,
        } as FireflyRedPacketAPI.CheckClaimStrategyStatusOptions['profile'];
    }

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
