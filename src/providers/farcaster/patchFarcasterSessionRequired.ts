import { FarcasterPatchSignerError } from '@/constants/error.js';
import { NOT_DEPEND_SECRET } from '@/constants/static.js';
import { FAKE_SIGNER_REQUEST_TOKEN, type FarcasterSession } from '@/providers/farcaster/Session.js';

export function patchFarcasterSessionRequired(session: FarcasterSession, fid: number, token: string | undefined) {
    if (session.profileId === NOT_DEPEND_SECRET) {
        session.profileId = `${fid}`;
    }
    if (session.token === NOT_DEPEND_SECRET) {
        if (!token) throw new FarcasterPatchSignerError(fid);

        session.token = token;
        session.signerRequestToken = FAKE_SIGNER_REQUEST_TOKEN;
    }
    return session;
}
