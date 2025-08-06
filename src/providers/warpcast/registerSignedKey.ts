import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithAddressVerification } from '@/providers/warpcast/createSignedKeyPayload.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';

export async function registerAuthAddress(signal?: AbortSignal) {
    const client = await getWalletClientRequired(wagmiConfig);
    const response = await createSignedKeyPayloadWithAddressVerification(client.account.address, signal);
    const key = await createSignedKey(response.body, signal);
    return pollingSignerRequestToken(key.token, signal);
}
