import { sentryClient } from '@/configs/sentryClient.js';
import {
    AbortError,
    AuthenticationError,
    FarcasterPatchSignerError,
    FireflyAlreadyBoundError,
    NotAllowedError,
    NotImplementedError,
} from '@/constants/error.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Session } from '@/providers/types/Session.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';
import { bindFireflySession } from '@/services/bindFireflySession.js';
import { restoreFireflySession } from '@/services/restoreFireflySession.js';

export async function bindOrRestoreFireflySession(session: Session, signal?: AbortSignal) {
    try {
        const farcasterSession = session as FarcasterSession;
        if (FarcasterSession.isCustodyWallet(farcasterSession)) throw new NotAllowedError();

        if (fireflySessionHolder.session) {
            await bindFireflySession(session, signal);

            // this will return the existing session
            return fireflySessionHolder.assertSession(
                '[bindOrRestoreFireflySession] Failed to bind farcaster session with firefly.',
            );
        } else {
            throw new AuthenticationError('[bindOrRestoreFireflySession] Firefly session is not available.');
        }
    } catch (error) {
        sentryClient.captureException(ExceptionId.BIND_OR_RESTORE_FIREFLY_SESSION, error, {
            profileId: session.profileId,
            sessionType: session.type,
        });

        if (error instanceof FarcasterPatchSignerError || error instanceof AbortError) {
            throw error;
        }

        // enqueue error message later
        if (error instanceof FireflyAlreadyBoundError) throw error;

        if (error instanceof FarcasterPatchSignerError) throw error;

        // this will create a new session
        return restoreFireflySession(session, signal);
    }
}

export async function restoreOrBindFireflySession(session: Session, signal?: AbortSignal) {
    throw new NotImplementedError();
}
