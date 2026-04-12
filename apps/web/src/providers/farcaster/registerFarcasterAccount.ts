import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { parseFarcasterBioContext } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile, ProfileForSignup } from '@/providers/types/SocialMedia.js';
import { createFarcasterSessionBySigner } from '@/providers/warpcast/createAccountByWallet.js';
import type { ResponseJson } from '@/types/utility.js';

interface FarcasterSignerInfo {
    accessToken: string;
    accountId: string;
    fid: string;
    signerPrivatekey: string;
    signerPublickey: string;
}

function createProfileBySignupInfo(signupInfo: ProfileForSignup, fid: string): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        fullHandle: signupInfo.handle ?? '',
        profileId: fid,
        handle: signupInfo.handle ?? '',
        displayName: signupInfo.displayName ?? '',
        pfp: signupInfo.pfp ?? '',
        bio: signupInfo.bio,
        bioContext: parseFarcasterBioContext(signupInfo.bio ?? ''),
        address: undefined,
        followerCount: 0,
        followingCount: 0,
        viewerContext: {
            following: false,
            followedBy: false,
        },
        isPowerUser: false,
        isProUser: false,
    };
}

export async function registerFarcasterAccount(profile: ProfileForSignup): Promise<Account> {
    if (!profile.handle) throw new Error('Farcaster handle is required.');

    // 1. register fid on chain and bind session
    const signerInfoRes = await fireflySessionHolder.fetchWithSession<ResponseJson<FarcasterSignerInfo>>(
        '/api/firefly/far-signup',
        {
            method: 'POST',
            body: JSON.stringify(profile),
        },
    );
    const signerInfo = resolveResponseData(signerInfoRes);

    // 2. create session and account
    const farcasterSession = await createFarcasterSessionBySigner({
        publickey: signerInfo.signerPublickey,
        privatekey: signerInfo.signerPrivatekey,
        fid: signerInfo.fid,
    });
    const newProfile = createProfileBySignupInfo(profile, signerInfo.fid);
    return {
        profile: newProfile,
        session: farcasterSession,
        fireflySession: fireflySessionHolder.session ?? undefined,
        origin: 'signup',
    };
}
