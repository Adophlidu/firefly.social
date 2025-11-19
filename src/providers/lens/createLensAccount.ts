import { canCreateUsername, createAccountWithUsername, fetchAccount } from '@lens-protocol/client/actions';

import { env } from '@/constants/env.js';
import { InvalidResultError } from '@/constants/error.js';
import { retry } from '@/helpers/retry.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { createLensSDK, MemoryStorageProvider } from '@/providers/lens/createLensSDK.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { account } from '@/providers/lens/metadata/Account.js';
import { uploadLensMetadataToS3 } from '@/providers/lens/uploadLensMetadataToS3.js';
import type { Account } from '@/providers/types/Account.js';
import type { ProfileForSignup } from '@/providers/types/SocialMedia.js';

export async function createLensAccount(profile: ProfileForSignup): Promise<Account> {
    if (!profile.handle) {
        throw new Error('Handle is required to create Lens account');
    }

    const walletClient = await getWalletClientForLensChain();

    const address = safeEvmAddress(walletClient.account.address);
    const sdk = createLensSDK(new MemoryStorageProvider());

    // 1. login to lens
    const sessionClient = await ensureLensResult(
        sdk.login({
            onboardingUser: {
                wallet: address,
                app: env.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
            },
            signMessage: (message) => walletClient.signMessage({ message }),
        }),
    );

    // 2. verify handle
    const result = await ensureLensResult(canCreateUsername(sessionClient, { localName: profile.handle }));
    switch (result.__typename) {
        case 'NamespaceOperationValidationPassed':
            break;
        case 'NamespaceOperationValidationFailed':
            throw new Error('You are unable to create a User Name');
        case 'NamespaceOperationValidationUnknown':
            throw new Error('Unable to verify User Name availability');
        case 'UsernameTaken':
            throw new Error('User Name is already taken');
        default:
            throw new Error('Unexpected error during User Name verification');
    }

    // 3. create account metadata
    const accountMetadata = account({
        id: crypto.randomUUID(),
        name: profile.displayName,
        bio: profile.bio || undefined,
        picture: profile.pfp || undefined,
    });
    const metadataUri = await uploadLensMetadataToS3(accountMetadata);

    // 4. deploy account contract
    const txData = await ensureLensResult(
        createAccountWithUsername(sessionClient, {
            username: { localName: profile.handle },
            metadataUri,
        }),
    );
    const txHash = await handleOperationWithLensChain(txData);

    // 5. switch to account owner session
    const lensAccount = await retry(
        async () => {
            const result = await ensureLensResult(fetchAccount(sessionClient, { txHash }));
            if (!result) throw new InvalidResultError();

            return result;
        },
        { times: 20, interval: 300 },
    );
    if (!lensAccount) {
        throw new Error('Failed to fetch created Lens account');
    }

    const ownerSessionClient = await ensureLensResult(sessionClient.switchAccount({ account: lensAccount.address }));

    // 6. create firefly account
    const lensProfile = formatLensProfileV3(lensAccount);
    const lensSession = createLensSession(lensProfile.profileId, ownerSessionClient);
    return {
        profile: lensProfile,
        origin: 'signup',
        session: lensSession,
        fireflySession: fireflySessionHolder.session ?? undefined,
    } satisfies Account;
}
