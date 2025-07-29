import { idRegistryABI } from '@farcaster/core';
import type { SignInOptions } from '@farcaster/miniapp-host';
import urlcat from 'urlcat';
import { type Address, checksumAddress, parseUnits, toHex } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { FARCASTER_REPLY_URL, SITE_URL, WARPCAST_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { getFarcasterAuthToken } from '@/providers/farcaster/getFarcasterAuthToken.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { pollingChannelToken } from '@/providers/warpcast/pollingChannelToken.js';
import { pollingRemoteSiwfToken } from '@/providers/warpcast/pollingRemoteSiwfToken.js';
import type { FrameV2 } from '@/types/frame.js';

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

export async function signInWithFarcaster(frame: FrameV2, fid: string, options: SignInOptions) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = await createSiwfMessage(url, fid, options.nonce);

    // Assume we have a BE api endpoint that can sign the message
    const signature = await FireflyEndpointProvider.signMessageWithCustodyWallet(fid, toHex(message));

    return {
        message,
        signature,
        authMethod: 'custody',
    } as const;
}

/**
 * Learn more about auth address implementation:
 * https://warpcast.notion.site/Public-Auth-Addresses-Implementation-1f36a6c0c101806ea4ffd45f3343113e
 * https://warpcast.notion.site/Public-Auth-Address-Implementation-Guide-1fc6a6c0c10180a9b2a7f24c71143eae
 * @param frame
 * @param options
 * @returns
 */
export async function signInWithRelayService(
    frame: FrameV2,
    options: SignInOptions,
    callback?: (url: string) => void,
    signal?: AbortSignal,
) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const response = await fetchJSON<{
        url: string;
        channelToken: string;
    }>(urlcat(FARCASTER_REPLY_URL, '/v1/channel'), {
        method: 'POST',
        body: JSON.stringify({
            siweUri: url,
            nonce: options.nonce,
            domain: u.hostname,
        }),
    });

    callback?.(response.url);

    const signed = await pollingChannelToken(response.channelToken, signal);
    return signed;
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
export async function signInWithAuthWallet(
    frame: FrameV2,
    fid: string,
    options: SignInOptions,
    callback?: (url: string) => void,
    signal?: AbortSignal,
) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = await createSiwfMessage(url, fid, options.nonce);

    const client = await getWalletClientRequired(config);

    // TODO: check if the client wallet is registered as a auth address
    // TODO: if not, register it

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

/**
 * Sign with the official Farcaster endpoint.
 * However, this requires a Farcaster token.
 * @param frame
 * @param fid
 * @param nonce
 * @returns
 */
export async function signInWithRemoteFarcaster(frame: FrameV2, fid: string, nonce: string) {
    const url = frame.x_url || SITE_URL;

    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const token = await getFarcasterAuthToken();
    if (!token) throw new Error('Missing farcaster token');

    const message = await createSiwfMessage(url, fid, nonce);

    // Assume we have a BE api endpoint that can sign the message
    const siwf = await fetchJSON<{
        result: {
            token: string;
        };
    }>(urlcat(WARPCAST_ROOT_URL, '/remote-siwf'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            message,
            source: {
                type: 'frame',
                domain: u.hostname,
            },
        }),
    });

    const signature = await pollingRemoteSiwfToken(siwf.result.token);
    return {
        message,
        signature,
        authMethod: 'custody',
    } as const;
}
