import bs58 from 'bs58';
import { type Address } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { ClickOrigin, NetworkType } from '@/constants/enum.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { getWalletAdaptorRequired, WalletNotConnectedError } from '@/providers/solana/getWalletAdapter.js';

export async function verifyAndBindWallet(network: NetworkType, checkExistedConnection?: (address: string) => boolean) {
    switch (network) {
        case NetworkType.Ethereum: {
            const walletClient = await getWalletClientRequired(wagmiConfig, undefined, {
                origin: ClickOrigin.Settings,
            });
            const address = walletClient.account.address;
            if (checkExistedConnection?.(address)) return;
            const message = await FireflyEndpointProvider.getMessageToSignForBindWallet(address.toLowerCase());
            const signature = await walletClient.signMessage({
                message: { raw: message },
                account: address as Address,
            });
            return FireflyEndpointProvider.verifyAndBindWallet(message, signature);
        }
        case NetworkType.Solana: {
            const adapter = await getWalletAdaptorRequired({
                origin: ClickOrigin.Settings,
            });
            const address = adapter.publicKey.toBase58();
            if (checkExistedConnection?.(address)) return;
            const hexMessage = await FireflyEndpointProvider.getMessageToSignMessageForBindSolanaWallet(address);
            const message = bs58.decode(bs58.encode(Buffer.from(hexMessage.substring(2), 'hex')));
            const signature = Buffer.from(await adapter.signMessage(message)).toString('hex');
            return FireflyEndpointProvider.verifyAndBindSolanaWallet(address, hexMessage, signature);
        }
        default:
            safeUnreachable(network);
            throw new WalletNotConnectedError();
    }
}
