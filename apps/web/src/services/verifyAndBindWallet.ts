import { ClickOrigin, NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import bs58 from 'bs58';
import { type Address, createWalletClient, custom } from 'viem';
import { getConnections } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';
import { getMessageToSignForBindWallet } from '@/providers/firefly/endpoint/getMessageToSignForBindWallet.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';

function parseEvmAddressFromCaip(caipAddress: string): string | undefined {
    // eip155:<chainId>:<address>
    if (!caipAddress.startsWith('eip155:')) return undefined;
    return caipAddress.split(':')[2];
}

/**
 * Bind the currently-connected wallet of `network`.
 *
 * For EVM, callers inside the wallet-connect modal's onConnect window pass
 * `caipAddress`. The wagmi connection is torn down within the first await, so
 * wagmi's getWalletClient can't produce a signer — instead the connector is
 * captured synchronously and a viem walletClient is built from its EIP-1193
 * provider, which outlives the teardown.
 */
export async function verifyAndBindWallet(
    network: NetworkType,
    checkExistedConnection?: (address: string) => boolean,
    caipAddress?: string,
) {
    switch (network) {
        case NetworkType.Ethereum: {
            const evmAddress = parseEvmAddressFromCaip(caipAddress ?? '');
            if (evmAddress) {
                if (checkExistedConnection?.(evmAddress)) return;
                // Capture synchronously: getConnections still lists the wallet here,
                // but it'll be empty after the first await below.
                const connection = getConnections(wagmiConfig).find((c) =>
                    c.accounts.some((a) => a.toLowerCase() === evmAddress.toLowerCase()),
                );
                // Re-resolve the canonical connector from wagmiConfig.connectors (as
                // AppKit's WagmiAdapter does): the ref on a Connection right after
                // reconnect() can be a stale snapshot without getProvider().
                const connector = connection
                    ? (wagmiConfig.connectors.find((c) => c.id === connection.connector.id) ?? connection.connector)
                    : undefined;
                if (!connector) throw new WalletNotConnectedError();

                const provider = (await connector.getProvider()) as unknown as Parameters<typeof custom>[0] | null;
                if (!provider) throw new WalletNotConnectedError();

                // MetaMask emits a spurious accountsChanged([]) right after connect.
                // It cascades through wagmi → AppKit and tears down (and de-authorizes)
                // the connection before the backend challenge fetch returns, forcing a
                // second eth_requestAccounts popup. Temporarily detach the provider's
                // accountsChanged listeners so that event is ignored, keeping the
                // connection (and authorization) alive across the fetch + sign.
                const emitter = provider as unknown as {
                    listeners?: (event: string) => unknown[];
                    off?: (event: string, listener: unknown) => void;
                    on?: (event: string, listener: unknown) => void;
                };
                const suspendedListeners = emitter.listeners?.('accountsChanged') ?? [];
                suspendedListeners.forEach((listener) => emitter.off?.('accountsChanged', listener));

                try {
                    const message = await getMessageToSignForBindWallet(evmAddress.toLowerCase());
                    // Re-authorize in case the spurious accountsChanged([]) de-selected
                    // the account. Silent if authorization persisted; otherwise MetaMask
                    // prompts once to re-select the account.
                    await provider.request({ method: 'eth_requestAccounts' });
                    const walletClient = createWalletClient({
                        account: evmAddress as Address,
                        transport: custom(provider),
                    });
                    const signature = await walletClient.signMessage({ message: { raw: message } });
                    return fireflyWalletProvider.verifyAndBindWallet(message, signature);
                } finally {
                    suspendedListeners.forEach((listener) => emitter.on?.('accountsChanged', listener));
                }
            }

            // Fallback for callers without a caipAddress (resolve via wagmi).
            const connector = resolveEvmConnector(wagmiConfig);
            const walletClient = await getWalletClientRequired(wagmiConfig, connector ? { connector } : undefined, {
                origin: ClickOrigin.Settings,
            });
            const address = walletClient.account.address;
            if (checkExistedConnection?.(address)) return;
            const message = await getMessageToSignForBindWallet(address.toLowerCase());
            const signature = await walletClient.signMessage({
                message: { raw: message },
                account: address as Address,
            });
            return fireflyWalletProvider.verifyAndBindWallet(message, signature);
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
