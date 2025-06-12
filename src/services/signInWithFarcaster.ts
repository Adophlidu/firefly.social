import { idRegistryABI } from '@farcaster/core';
import urlcat from 'urlcat';
import { type Address, checksumAddress, parseUnits, toHex } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { WARPCAST_CLIENT_URL_V1 } from '@/constants/index.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { pollingRemoteSiwfToken } from '@/providers/warpcast/pollingRemoteSiwfToken.js';

/**
 * Returns the custody address of a Farcaster ID.
 * Learn more: https://docs.farcaster.xyz/learn/architecture/contracts
 * @param fid - Farcaster ID
 * @returns
 */
async function custodyOf(fid: string): Promise<string> {
    const address = await readContract(config, {
        abi: idRegistryABI,
        address: '0x00000000fc6c5f01fc30151999387bb99a9f489b',
        functionName: 'custodyOf',
        args: [parseUnits(fid, 0)],
        chainId: EthereumChainId.Optimism,
    });
    if (!isValidAddressEthereum(address)) throw new Error(`Invalid custody address: ${address}`);
    return address;
}

async function createSiwfMessage(url: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const address = await custodyOf(fid);
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

export async function signInWithFarcaster(url: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = await createSiwfMessage(url, fid, nonce);

    console.log('DEBUG: [signInWithFarcaster]: message', {
        url,
        fid,
        nonce,
        message,
    });

    // Assume we have a BE api endpoint that can sign the message
    const signature = await FireflyEndpointProvider.signMessageWithCustodyWallet(fid, toHex(message));

    return {
        message,
        signature,
    };
}

export async function signInWithWarpcast(url: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = await createSiwfMessage(url, fid, nonce);

    // Assume we have a BE api endpoint that can sign the message
    const siwf = await farcasterSessionHolder.fetch<{
        result: {
            token: string;
        };
    }>(urlcat(WARPCAST_CLIENT_URL_V1, '/remote-siwf'), {
        method: 'POST',
        body: JSON.stringify({
            type: 'frame',
            domain: u.hostname,
            message,
        }),
    });

    const signature = await pollingRemoteSiwfToken(siwf.result.token);
    return {
        message,
        signature,
    };
}
