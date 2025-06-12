import { idRegistryABI } from '@farcaster/core';
import urlcat from 'urlcat';
import { type Address, checksumAddress, parseUnits, toHex } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { FARCASTER_REPLY_URL, WARPCAST_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getFarcasterAuthToken } from '@/helpers/getFarcasterAuthToken.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { RelayConfirmationPopoverRef } from '@/modals/FrameViewerModal/controls.js';
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

export async function signInWithFarcaster(url: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const message = await createSiwfMessage(url, fid, nonce);

    // Assume we have a BE api endpoint that can sign the message
    const signature = await FireflyEndpointProvider.signMessageWithCustodyWallet(fid, toHex(message));

    return {
        message,
        signature,
        authMethod: 'custody',
    } as const;
}

export async function signInWithRemoteFarcaster(url: string, fid: string, nonce: string) {
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

export async function signInWithRelay(frame: FrameV2, url: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    // Assume we have a BE api endpoint that can sign the message
    const { url: schemaUrl, channelToken } = await fetchJSON<{
        url: string;
        channelToken: string;
    }>(urlcat(FARCASTER_REPLY_URL, '/v1/channel'), {
        method: 'POST',
        body: JSON.stringify({
            siweUri: url,
            domain: u.hostname,
            nonce,
        }),
    });

    RelayConfirmationPopoverRef.open({
        schemaUrl,
        frame,
    });

    const signed = await pollingChannelToken(channelToken);
    console.log('DEBUG: signInWithRelay signature', signed);

    RelayConfirmationPopoverRef.close();

    return {
        message: signed.message,
        signature: signed.signature,
        authMethod: 'custody',
    } as const;
}
