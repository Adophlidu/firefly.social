import { uri } from '@lens-protocol/client';
import { createAccountWithUsername, fetchAccount } from '@lens-protocol/client/actions';
import { account, type AccountOptions } from '@lens-protocol/metadata';
import { getAccount, signMessage } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { ensureLensResult } from '@/helpers/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/helpers/handleOperationWithLensChain.js';
import { GroveStorageProvider } from '@/providers/lens/Grove.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';

async function loginAsOnboardingUser(lensApp: string, address: string) {
    return ensureLensResult(
        lensSessionHolder.sdk.login({
            onboardingUser: {
                // app: lensApp,
                wallet: address,
            },
            signMessage: (message) => signMessage(config, { message }),
        }),
    );
}

async function uploadAccountMetadata(accountInfo: AccountOptions) {
    const accountMetadata = account(accountInfo);

    const { uri } = await GroveStorageProvider.uploadJson(accountMetadata);

    return uri;
}

export async function createLensV3Account(lensApp: string, nameToMint: string, accountInfo: AccountOptions) {
    const walletAccount = getAccount(config);
    if (!walletAccount.address) {
        throw new Error('wallet not connected');
    }

    // login as onboarding user
    const sessionClient = await loginAsOnboardingUser(lensApp, walletAccount.address);

    // upload account metadata
    const accountMetadataUri = await uploadAccountMetadata(accountInfo);

    const result = await ensureLensResult(
        createAccountWithUsername(sessionClient, {
            username: { localName: nameToMint },
            metadataUri: uri(accountMetadataUri),
        }),
    );
    const txHash = await handleOperationWithLensChain(result, false);
    const account = await ensureLensResult(fetchAccount(sessionClient, { txHash }));
    if (!account) {
        throw new Error('Account not found');
    }

    const newSessionClient = await sessionClient.switchAccount({
        account: account.address,
    });

    return { sessionClient: newSessionClient, lensAccount: account };
}
