import { SessionType, Source } from '@dimensiondev/enums';

import { NOT_DEPEND_SECRET } from '@/constants/static.js';
import { createDummyProfileFromThirdPartySession } from '@/helpers/createDummyProfile.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

export async function createAccountByPasscode(email: string, passcode: string) {
    const now = Date.now();

    const session = new ThirdPartySession(SessionType.Email, NOT_DEPEND_SECRET, NOT_DEPEND_SECRET, now, now, {
        email,
        passcode,
    });

    return {
        session,
        fireflySession: await bindOrRestoreFireflySession(session),
        profile: createDummyProfileFromThirdPartySession(Source.Email, session),
    };
}
