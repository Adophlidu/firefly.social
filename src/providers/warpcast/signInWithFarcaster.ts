import { parseUrl } from '@dimensiondev/utils';
import { type SignInOptions } from '@farcaster/miniapp-host';
import { type Address, checksumAddress, toHex } from 'viem';

import { SITE_URL } from '@/constants/static.js';
import { signMessageWithCustodyWallet } from '@/providers/firefly/farcaster-account/signMessageWithCustodyWallet.js';
import { custodyOf } from '@/providers/warpcast/custodyOf.js';
import { type FrameV2 } from '@/types/frame.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function createSiwfMessage(url: string, address: string, fid: string, nonce: string) {
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
    const signature = await signMessageWithCustodyWallet(fid, toHex(message));

    return {
        message,
        signature,
        authMethod: 'custody',
    } as const;
}
