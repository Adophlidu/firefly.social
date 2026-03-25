import { envs } from '@dimensiondev/envs';
import { InvalidResultError, retry } from '@dimensiondev/utils';
import { type SessionClient } from '@lens-protocol/client';
import { canCreateUsername, createAccountWithUsername, fetchAccount } from '@lens-protocol/client/actions';
import { mainnet } from 'viem/chains';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { reportLensAccount } from '@/providers/firefly/report/reportLensAccount.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { createLensPublicClient } from '@/providers/lens/createLensPublicClient.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { account } from '@/providers/lens/metadata/Account.js';
import { uploadLensMetadataToS3 } from '@/providers/lens/uploadLensMetadataToS3.js';
import { type Account } from '@/providers/types/Account.js';
import { type Profile, type ProfileForSignup } from '@/providers/types/SocialMedia.js';

const loginOnboardingUser = memoizePromise(
    async (address: string) => {
        const walletClient = await getWalletClientRequired(wagmiConfig, { chainId: mainnet.id });
        const client = createLensPublicClient();
        return ensureLensResult(
            client.login({
                onboardingUser: {
                    wallet: address,
                    app: envs.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
                },
                signMessage: (message) => walletClient.signMessage({ message }),
            }),
        );
    },
    (address: string) => `loginOnboardingUser-${address}`,
);
const uploadAccountMetadata = memoizePromise(
    async (profile: ProfileForSignup) => {
        const accountMetadata = account({
            id: crypto.randomUUID(),
            name: profile.displayName,
            bio: profile.bio || undefined,
            picture: profile.pfp || undefined,
        });
        return uploadLensMetadataToS3(accountMetadata);
    },
    (profile) => `${profile.handle}.${profile.displayName}.${profile.bio}.${profile.pfp}`,
);
const deployAccountContract = memoizePromise(
    async (sessionClient: SessionClient, handle: string, metadataUri: string, address: string) => {
        const txData = await ensureLensResult(
            createAccountWithUsername(sessionClient, {
                username: { localName: handle },
                metadataUri,
            }),
        );
        return handleOperationWithLensChain(txData, true, sessionClient);
    },
    (sessionClient: SessionClient, handle: string, metadataUri: string, address: string) =>
        `${handle}-${metadataUri}-${address}`,
);

export async function createLensAccount(profile: ProfileForSignup): Promise<Account> {
    if (!profile.handle) {
        throw new Error('Handle is required to create Lens account');
    }

    // 1. login to lens
    const walletClient = await getWalletClientForLensChain();
    const ownerAddress = safeEvmAddress(walletClient.account.address);
    const sessionClient = await loginOnboardingUser(ownerAddress);

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
    const metadataUri = await uploadAccountMetadata(profile);

    // 4. deploy account contract
    const txHash = await deployAccountContract(sessionClient, profile.handle, metadataUri, ownerAddress);

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
    const lensProfile: Profile = {
        ...formatLensProfileV3(lensAccount),
        displayName: profile.displayName || '',
        handle: profile.handle || '',
        pfp: profile.pfp || getStampAvatarByProfileId(Source.Lens, lensAccount.address),
        bio: profile.bio || '',
    };
    const lensSession = createLensSession(lensProfile.profileId, ownerSessionClient);
    const fireflyAccount = {
        profile: lensProfile,
        origin: 'signup',
        session: lensSession,
        fireflySession: fireflySessionHolder.session ?? undefined,
    } satisfies Account;

    // 7. report account to neo4j
    await runInSafeAsync(() => reportLensAccount(fireflyAccount, AbortSignal.timeout(60 * 1000)));

    return fireflyAccount;
}
