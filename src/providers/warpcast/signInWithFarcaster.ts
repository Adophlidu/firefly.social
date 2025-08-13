import type { SignInOptions } from '@farcaster/miniapp-host';
import { type Address, checksumAddress, parseUnits, toHex } from 'viem';
import { readContract } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SITE_URL } from '@/constants/index.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { registerAuthAddress } from '@/providers/warpcast/registerSignedKey.js';
import type { FrameV2 } from '@/types/frame.js';

const ABI = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
        ],
        name: 'custodyOf',
        outputs: [
            {
                internalType: 'address',
                name: 'custody',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'idOf',
        outputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'idOfByAddress',
        outputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
        ],
        name: 'ownerOf',
        outputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Returns the custody address of a Farcaster ID.
 * Learn more: https://docs.farcaster.xyz/learn/architecture/contracts
 * @param fid - Farcaster ID
 * @returns
 */
async function custodyOf(fid: string): Promise<string> {
    const address = await readContract(wagmiConfig, {
        abi: ABI,
        address: '0x00000000fc6c5f01fc30151999387bb99a9f489b',
        functionName: 'custodyOf',
        args: [parseUnits(fid, 0)],
        chainId: EthereumChainId.Optimism,
    });
    if (!isValidAddressEthereum(address)) throw new Error(`Invalid custody address: ${address}`);
    return address;
}

async function fidOf(address: `0x${string}`) {
    const fid = await readContract(wagmiConfig, {
        abi: ABI,
        address: '0x00000000fc6c5f01fc30151999387bb99a9f489b',
        functionName: 'idOf',
        args: [address],
        chainId: EthereumChainId.Optimism,
    });
    return fid.toString();
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
    const client = await getWalletClientRequired(wagmiConfig);

    const registeredFid = await fidOf(client.account.address);

    console.log('DEBUG: registered fid');
    console.log({
        registeredFid,
    });

    if (!registeredFid || registeredFid !== fid) {
        await registerAuthAddress(client.account.address, callback, signal);
    }

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
