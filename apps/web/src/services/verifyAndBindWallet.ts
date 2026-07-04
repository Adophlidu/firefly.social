import { ClickOrigin, NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import bs58 from 'bs58';
import type { Address, Hex } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { createEIP1193Provider } from '@/helpers/createEIP1193Provider.js';
import { getEip1193ProviderByRdns } from '@/helpers/getEip1193ProviderByRdns.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';
import { getMessageToSignForBindWallet } from '@/providers/firefly/endpoint/getMessageToSignForBindWallet.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';

/**
 * Best-effort resolution of the EIP-6963 rdns of the injected wallet the user
 * just connected in the AppKit modal. wagmi's MIPD connectors use the wallet's
 * rdns as the connector id (e.g. 'io.metamask'), so the non-Privy connection's
 * connector id IS the rdns. Returns undefined for non-injected connectors
 * (WalletConnect id has no dot) or when wagmi state is unavailable — the caller
 * then falls back to wagmi's walletClient. Lazy import keeps wagmi out of the
 * static graph of this service's consumers. Never throws.
 */
async function resolveActiveEvmRdns(): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;

    try {
        const [{ getConnections }, { wagmiConfig }, { PRIVY_CONNECTOR_ID }] = await Promise.all([
            import('wagmi/actions'),
            import('@/configs/wagmiClient.js'),
            import('@/connectors/PrivyConnector.js'),
        ]);
        const connection = getConnections(wagmiConfig).find((c) => c.connector.id !== PRIVY_CONNECTOR_ID);
        const id = connection?.connector.id;
        // MIPD-discovered injected connectors use the rdns as their id
        // ('io.metamask', 'app.phantom'); the generic injected connector id
        // 'injected' and WalletConnect's 'walletConnect' are not rdns and are
        // ignored so the caller uses the wagmi walletClient fallback.
        return id?.includes('.') ? id : undefined;
    } catch {
        return undefined;
    }
}

/** Bind the currently-connected wallet of `network`. */
export async function verifyAndBindWallet(network: NetworkType, checkExistedConnection?: (address: string) => boolean) {
    switch (network) {
        case NetworkType.Ethereum: {
            // FW-7834: when MetaMask and Phantom are both installed, Phantom
            // overwrites window.ethereum, so MetaMask is only reachable through
            // its EIP-6963 rdns ('io.metamask'). Reading raw window.ethereum
            // made the bind sign with whichever wallet won the injection race —
            // MetaMask binding failed on fresh Vercel origins while Phantom
            // worked, and rotating the signing API never fixed it because the
            // fault is upstream of the signing call, in provider IDENTITY.
            //
            // For injected wallets we now acquire the EIP-1193 provider
            // deterministically by EIP-6963 rdns and drive eth_requestAccounts →
            // personal_sign on that single object, keeping every request on the
            // intended wallet and out of wagmi's post-modal connect-state race.
            // Non-injected wallets (WalletConnect) have no EIP-6963 provider and
            // fall back to wagmi's walletClient — the same proven pattern as
            // verifyEthereumAddress.
            const rdns = await resolveActiveEvmRdns();
            const injectedProvider = rdns ? await getEip1193ProviderByRdns(rdns) : undefined;

            let address: string;
            let message: Hex;
            let signature: Hex;

            if (rdns && injectedProvider) {
                // Request-level logging — invaluable on staging origins where
                // the bind was previously opaque.
                const request = createEIP1193Provider((args) => injectedProvider.request(args)).request;
                const accounts = (await request<string[]>({ method: 'eth_requestAccounts' })) as string[] | undefined;
                address = accounts?.[0] ?? '';
                if (!address) throw new WalletNotConnectedError();
                if (checkExistedConnection?.(address)) return;
                message = await getMessageToSignForBindWallet(address.toLowerCase());
                signature = (await request<Hex>({
                    method: 'personal_sign',
                    params: [message, address],
                })) as Hex;
            } else {
                const connector = resolveEvmConnector(wagmiConfig);
                const walletClient = await getWalletClientRequired(wagmiConfig, connector ? { connector } : undefined, {
                    origin: ClickOrigin.Settings,
                });
                address = walletClient.account.address;
                if (checkExistedConnection?.(address)) return;
                message = await getMessageToSignForBindWallet(address.toLowerCase());
                signature = await walletClient.signMessage({
                    message: { raw: message },
                    account: address as Address,
                });
            }

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
