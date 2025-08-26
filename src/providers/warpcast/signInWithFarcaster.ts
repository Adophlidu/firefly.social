import type { SignInOptions } from '@farcaster/miniapp-host';
import { type Address, checksumAddress, toHex } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SITE_URL } from '@/constants/index.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { custodyOf } from '@/providers/warpcast/custodyOf.js';
import type { FrameV2 } from '@/types/frame.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

async function createSiwfMessage(url: string, address: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = [
        `${u.hostname} wants you to sign in with your Ethereum account:`,
        `${checksumAddress(address as Address)}`,
        '',
        'Farcaster Auth',
        '',
        `URI: ${url}`,
        'Version: 1',
        `Chain ID: ${EthereumChainId.Optimism}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
        'Resources:',
        `- farcaster://fid/${fid}`,
    ].join('\n');

    return message;
}

export async function signInWithFarcaster(frame: FrameV2, fid: string, options: SignInOptions) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const address = await custodyOf(fid);
    const message = await createSiwfMessage(url, address, fid, options.nonce);

    // Assume we have a BE api endpoint that can sign the message
    const signature = await FireflyEndpointProvider.signMessageWithCustodyWallet(fid, toHex(message));

    return {
        message,
        signature,
        authMethod: 'custody',
    } as const;
}

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
export async function signInWithAuthWallet(frame: FrameV2, fid: string, options: SignInOptions) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const client = await getWalletClientRequired(wagmiConfig);
    const message = await createSiwfMessage(url, client.account.address, fid, options.nonce);

    const signature = await client.signMessage({
        message: { raw: toHex(message) },
        account: client.account.address,
    });

    return {
        message,
        signature,
        authMethod: 'authAddress',
    } as const;
}
