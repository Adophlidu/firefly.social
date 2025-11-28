import { Source } from '@/constants/enum.js';
import { SEVEN_DAYS } from '@/constants/index.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { LensCredentials } from '@/providers/types/Lens.js';

export async function restoreLensSessionFromCredentials(
    credentials: LensCredentials,
    {
        updateStore = false,
    }: {
        updateStore?: boolean;
    },
) {
    updateCredentialsStorage(credentials);

    const sessionClient = await ensureLensResult(lensClientHolder.client.resumeSession());
    const user = ensureLensResultSync(sessionClient.getAuthenticatedUser());

    const now = Date.now();
    const session = new LensSession(
        user.address,
        credentials.accessToken,
        now,
        now + SEVEN_DAYS,
        credentials.refreshToken,
        user.address,
        credentials.idToken,
    );
    lensSessionHolder.resumeSession(session);
    lensSessionClientHolder.setSessionClient(sessionClient);

    if (updateStore) {
        const store = getProfileState(Source.Lens);
        const account = store.accounts.find((x) =>
            isSameProfile(x.profile, {
                source: Source.Lens,
                profileId: user.address,
                handle: '',
            }),
        );
        if (account) {
            const newAccount: Account = { ...account, session };
            store.addAccount(newAccount, true);
        }
    }

    return session;
}
