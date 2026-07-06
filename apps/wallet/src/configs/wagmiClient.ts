import { ETHEREUM_RPC_URL, OPTIMISM_RPC_URL, POLYGON_RPC_URL } from '@dimensiondev/constants/static';
import { envs } from '@dimensiondev/envs/wallet';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createStorage } from '@wagmi/core';
import { http } from 'viem';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    baseSepolia,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    hyperEvm,
    lens,
    lensTestnet,
    linea,
    mainnet,
    metis,
    monadTestnet,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

import { createPrivyWalletConnector } from '@/connectors/createPrivyWalletConnector.js';

const storage = createStorage({
    key: 'firefly-wallet',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

export const wagmiNetworks = [
    mainnet,
    base,
    baseSepolia,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    blast,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    lens,
    lensTestnet,
    celo,
    zkSync,
    linea,
    monadTestnet,
    plasma,
    hyperEvm,
] as AppKitNetwork[];

export const wagmiAdapter = new WagmiAdapter({
    projectId: envs.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    networks: wagmiNetworks,
    transports: {
        [mainnet.id]: http(ETHEREUM_RPC_URL),
        [optimism.id]: http(OPTIMISM_RPC_URL),
        [polygon.id]: http(POLYGON_RPC_URL),
        [fantom.id]: http('https://rpc.ftm.tools'),
    },
    storage,
    connectors: [createPrivyWalletConnector()],
    // FW-7834: this app is the embedded-wallet iframe, not a host for external
    // wallets. MIPD is on by default, which made this iframe auto-discover
    // MetaMask via the shared per-origin window.ethereum grant — so when the host
    // connected MetaMask, it appeared here as the active connector and
    // PrivyWalletAutomator disconnected it ("to avoid conflicts"), calling
    // wallet_revokePermissions and tearing the host's per-origin eth_accounts
    // grant → EIP-1193 4100 on the host's personal_sign. With MIPD off, this
    // iframe only ever registers the Privy connector above; external wallets the
    // host connects are invisible here, so the automator never sees a conflict
    // and the host grant is never revoked.
    multiInjectedProviderDiscovery: false,
});

export const config = wagmiAdapter.wagmiConfig;
