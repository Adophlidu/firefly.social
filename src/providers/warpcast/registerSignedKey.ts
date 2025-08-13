import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithAddressVerification } from '@/providers/warpcast/createSignedKeyPayload.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';

export async function registerAuthAddress(
    address: `0x${string}`,
    callback?: (url: string) => void,
    signal?: AbortSignal,
) {
    const response = await createSignedKeyPayloadWithAddressVerification(address, signal);
    const key = await createSignedKey(response.body, signal);

    // present deeplink QRCode image
    callback?.(key.deeplinkUrl);

    return pollingSignerRequestToken(key.token, signal);
}
