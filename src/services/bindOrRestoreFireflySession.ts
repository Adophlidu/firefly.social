import { AbortError, AuthenticationError } from '@dimensiondev/utils';

import { FarcasterPatchSignerError, FireflyAlreadyBoundError, FireflyBindTimeoutError } from '@/constants/error.js';
import { captureException, ExceptionId } from '@/providers/errorCapture/captureException.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Session } from '@/providers/types/Session.js';
import { bindFireflySession } from '@/services/bindFireflySession.js';
import { restoreFireflySession } from '@/services/restoreFireflySession.js';

export async function bindOrRestoreFireflySession(session: Session, signal?: AbortSignal) {
    try {
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
        captureException(ExceptionId.BIND_OR_RESTORE_FIREFLY_SESSION, error, {
            profileId: session.profileId,
            sessionType: session.type,
        });

        // skip if the error is due to the session being aborted
        if (AbortError.is(error)) throw error;
        if (error instanceof FarcasterPatchSignerError) throw error;
        if (error instanceof FireflyBindTimeoutError) throw error;

        // enqueue error message later
        if (error instanceof FireflyAlreadyBoundError) throw error;
        if (error instanceof FarcasterPatchSignerError) throw error;

        // this will create a new session
        return restoreFireflySession(session, signal);
    }
}
