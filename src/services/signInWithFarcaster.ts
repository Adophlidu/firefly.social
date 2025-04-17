import { idRegistryABI } from '@farcaster/core';
import urlcat from 'urlcat';
import { parseUnits } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { FIREFLY_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';

/**
 * Learn more: https://docs.farcaster.xyz/learn/architecture/contracts
 * @param fid - Farcaster ID
 * @returns
 */
async function custodyOf(fid: string): Promise<string> {
    const address = await readContract(config, {
        abi: idRegistryABI,
        address: '0x00000000fc6c5f01fc30151999387bb99a9f489b',
        functionName: 'custodyOf',
        args: [parseUnits(fid, 10)],
        chainId: EthereumChainId.Optimism,
    });
    if (!isValidAddressEthereum(address)) throw new Error(`Invalid custody address: ${address}`);
    return address;
}

export async function signInWithFarcaster(url: string, fid: string, nonce: string) {
    const u = parseUrl(url);
    if (!u) throw new Error(`Invalid URL: ${url}`);

    const address = await custodyOf(fid);
    const message = [
        `${url} wants you to sign in with your Ethereum account:`,
        `${address}`,
        '',
        'Farcaster Auth',
        '',
        `URI: ${url}`,
        'Version: 1',
        `Chain ID: ${EthereumChainId.Optimism}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
        'Resources:',
        `- farcaster://fids/${fid}`,
    ].join('\n');

    // Assume we have a BE api endpoint that can sign the message
    const signature = await fetchJSON<string>(urlcat(FIREFLY_ROOT_URL, '/api/v1/sign'), {
        method: 'POST',
        body: JSON.stringify({
            message,
        }),
    });

    return {
        message,
        signature,
    };
}
