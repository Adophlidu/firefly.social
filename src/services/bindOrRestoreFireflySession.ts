import {
    AuthenticationError,
    EmailAlreadyBoundError,
    FarcasterAlreadyBoundError,
    NotAllowedError,
    NotImplementedError,
} from '@/constants/error.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Session } from '@/providers/types/Session.js';
import { bindFireflySession } from '@/services/bindFireflySession.js';
import { restoreFireflySession } from '@/services/restoreFireflySession.js';

export async function bindOrRestoreFireflySession(session: Session, signal?: AbortSignal) {
    try {
        const farcasterSession = session as FarcasterSession;
        if (FarcasterSession.isCustodyWallet(farcasterSession)) throw new NotAllowedError();

        if (fireflySessionHolder.session) {
            await bindFireflySession(session, signal);

            // this will return the existing session
            return fireflySessionHolder.assertSession();
        } else {
            throw new AuthenticationError('[bindOrRestoreFireflySession] Firefly session is not available.');
        }
    } catch (error) {
        // enqueue error message later
        if (error instanceof FarcasterAlreadyBoundError || error instanceof EmailAlreadyBoundError) {
            throw error;
        }

        if (error instanceof Error && error.message.includes('This apple already bound to the other account')) {
            enqueueWarningMessage('This Apple account is already linked to another Firefly account.');
            throw error;
        }

        // this will create a new session
        return restoreFireflySession(session, signal);
    }
}

export async function restoreOrBindFireflySession(session: Session, signal?: AbortSignal) {
    throw new NotImplementedError();
}
