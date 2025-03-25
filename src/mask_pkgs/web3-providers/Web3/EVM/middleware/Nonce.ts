import { type ChainId, EthereumMethodType, type Middleware } from '@masknet/web3-shared-evm';
import { type Address, checksumAddress } from 'viem';

import { EVMWeb3Readonly } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ConnectionReadonlyAPI.js';
import type { ConnectionContext } from '@/mask_pkgs/web3-providers/Web3/EVM/libs/ConnectionContext.js';

class NonceAPI implements Middleware<ConnectionContext> {
    static INITIAL_NONCE = -1;

    // account address => chainId => nonce
    private nonces = new Map<string, Map<ChainId, number>>();

    private async syncRemoteNonce(chainId: ChainId, address: string, providerURL?: string, commitment = 0) {
        const address_ = checksumAddress(address as Address);
        const addressNonces = this.nonces.get(address_) ?? new Map<ChainId, number>();

        addressNonces.set(
            chainId,
            commitment +
                Math.max(
                    await EVMWeb3Readonly.getTransactionNonce(address, {
                        chainId,
                        providerURL,
                    }),
                    addressNonces.get(chainId) ?? NonceAPI.INITIAL_NONCE,
                ),
        );

        // set back into cache
        this.nonces.set(address_, addressNonces);
        return addressNonces.get(chainId)!;
    }

    async fn(context: ConnectionContext, next: () => Promise<void>) {
        await next(); // send transaction

        if (context.method !== EthereumMethodType.ETH_SEND_TRANSACTION) return;

        try {
            const message = context.error?.message ?? '';
            const isGeneralErrorNonce = /\bnonce|transaction\b/im.test(message) && /\b(low|high|old)\b/im.test(message);
            const isAuroraErrorNonce = message.includes('ERR_INCORRECT_NONCE');

            // if a nonce error was occurred then reset the nonce
            if (isGeneralErrorNonce || isAuroraErrorNonce)
                await this.syncRemoteNonce(context.chainId, context.account, context.providerURL);
            // if a transaction hash was received then commit the nonce
            else if (!context.error && typeof context.result === 'string')
                await this.syncRemoteNonce(context.chainId, context.account, context.providerURL, 1);
        } catch {
            // to scan the context to determine how to update the local nonce, allow to fail silently
        }
    }
}
export const Nonce = new NonceAPI();
