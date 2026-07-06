import { ClickOrigin, NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import bs58 from 'bs58';
import type { Address } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { getMessageToSignForBindWallet } from '@/providers/firefly/endpoint/getMessageToSignForBindWallet.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';

export async function verifyAndBindWallet(network: NetworkType, checkExistedConnection?: (address: string) => boolean) {
    switch (network) {
        case NetworkType.Ethereum: {
            const walletClient = await getWalletClientRequired(wagmiConfig, undefined, {
                origin: ClickOrigin.Settings,
            });
            const address = walletClient.account.address;
            if (checkExistedConnection?.(address)) return;
            const message = await getMessageToSignForBindWallet(address.toLowerCase());
            const signature = await walletClient.signMessage({
                message: { raw: message },
                account: address as Address,
            });
            return fireflyWalletProvider.verifyAndBindWallet(address.toLowerCase(), message, signature);
        }
        case NetworkType.Solana: {
            const adapter = await getWalletAdaptorRequired({
                origin: ClickOrigin.Settings,
            });
            const address = adapter.publicKey.toBase58();
            if (checkExistedConnection?.(address)) return;
            const hexMessage = await fireflyWalletProvider.getMessageToSignMessageForBindSolanaWallet(address);
            const message = bs58.decode(bs58.encode(Buffer.from(hexMessage.substring(2), 'hex')));
            const signature = Buffer.from(await adapter.signMessage(message)).toString('hex');
            return fireflyWalletProvider.verifyAndBindSolanaWallet(address, hexMessage, signature);
        }
        default:
            safeUnreachable(network);
            throw new WalletNotConnectedError();
    }
}
