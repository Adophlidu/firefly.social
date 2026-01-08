import { wagmiConfig } from '@/configs/wagmiClient.js';
import { ClickOrigin } from '@/constants/enum.js';
import { Protocol } from '@/constants/farcaster.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { addVerifiedAddress } from '@/providers/farcaster/addVerifiedAddress.js';
import {
    createEthereumVerificationMessage,
    createSolanaVerificationMessage,
} from '@/providers/farcaster/createVerificationMessage.js';
import { getEthereumBlockHash, getSolanaBlockHash } from '@/providers/farcaster/getBlockHash.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

/**
 * Verify an Ethereum address for Farcaster
 * @param fid - Farcaster ID
 * @returns The verified Ethereum address
 */
export async function verifyEthereumAddress(fid: string): Promise<string> {
    const blockHash = await getEthereumBlockHash();

    const walletClient = await getWalletClientRequired(wagmiConfig, undefined, {
        origin: ClickOrigin.Settings,
    });
    const address = walletClient.account.address.toLowerCase() as `0x${string}`;
    const typedData = createEthereumVerificationMessage({
        fid,
        address,
        blockHash,
        network: EthereumChainId.Mainnet,
    });
    const signature = await walletClient.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
    });
    await addVerifiedAddress({
        address,
        blockHash,
        signature: signature.toString(),
        protocol: Protocol.ETHEREUM,
    });
    return address;
}

/**
 * Verify a Solana address for Farcaster
 * @param fid - Farcaster ID
 * @returns The verified Solana address
 */
export async function verifySolanaAddress(fid: string): Promise<string> {
    const blockHash = await getSolanaBlockHash();

    const adapter = await getWalletAdaptorRequired({
        origin: ClickOrigin.Settings,
    });
    const address = adapter.publicKey.toBase58();
    const message = createSolanaVerificationMessage({
        fid,
        address,
        blockHash,
    });
    const signature = Buffer.from(await adapter.signMessage(new TextEncoder().encode(message))).toString('hex');
    await addVerifiedAddress({
        address,
        blockHash,
        signature,
        protocol: Protocol.SOLANA,
    });
    return address;
}
