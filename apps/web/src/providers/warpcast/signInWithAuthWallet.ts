import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import { parseUrl } from '@dimensiondev/utils';
import type { SignInOptions } from '@farcaster/miniapp-host';
import { toHex } from 'viem';
import { optimism } from 'viem/chains';

import { SITE_URL } from '@/constants/static.js';
import { logger } from '@/libs/Logger.js';
import { createSiwfMessage } from '@/providers/warpcast/signInWithFarcaster.js';
import type { FrameV2 } from '@/types/frame.js';

/**
 * Sign in with the auth wallet.
 * Learn more about auth address implementation:
 * https://farcasterhq.notion.site/Public-Auth-Address-Implementation-Guide-1fc6a6c0c10180a9b2a7f24c71143eae
 * @param frame
 * @param fid
 * @param options
 * @param signal
 * @returns
 */
export async function signInWithAuthWallet(
    address: `0x${string}`,
    frame: FrameV2,
    fid: string,
    options: SignInOptions,
) {
    const signMessage = async (message: string) => {
        if (nativeBridgeProvider.supported) {
            return nativeBridgeProvider.request(SupportedMethod.SIGN_MESSAGE, {
                chainId: toHex(optimism.id),
                address,
                message,
            });
        } else {
            return iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE, {
                chainId: toHex(optimism.id),
                address,
                message,
            });
        }
    };

    logger.info(`[signInWithAuthWallet] sign in with wallet address=${address}`);

    const url = frame.button.action.url || frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const siwfMessage = await createSiwfMessage(url, address, fid, options.nonce);
    const signature = await signMessage(siwfMessage);

    logger.info(
        `[signInWithAuthWallet] signed ${JSON.stringify({ url, address, fid, options, siwfMessage, signature })}`,
    );

    return {
        message: siwfMessage,
        signature,
        authMethod: 'authAddress',
    } as const;
}
