import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import { parseUrl } from '@dimensiondev/utils';
import type { SignInOptions } from '@farcaster/miniapp-host';
import { toHex } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SITE_URL } from '@/constants/index.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { createSiwfMessage } from '@/providers/warpcast/signInWithFarcaster.js';
import type { FrameV2 } from '@/types/frame.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

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
                chainId: toHex(EthereumChainId.Optimism),
                address,
                message,
            });
        } else {
            const client = await getWalletClientRequired(wagmiConfig);
            const signature = await client.signMessage({
                message,
                account: address,
            });
            return signature;
        }
    };

    console.log(`[signInWithAuthWallet] sign in with wallet address=${address}`);

    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const siwfMessage = await createSiwfMessage(url, address, fid, options.nonce);
    const signature = await signMessage(siwfMessage);

    console.log(
        `[signInWithAuthWallet] signed ${JSON.stringify({ url, address, fid, options, siwfMessage, signature })}`,
    );

    return {
        message: siwfMessage,
        signature,
        authMethod: 'authAddress',
    } as const;
}
