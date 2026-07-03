import { NetworkType } from '@dimensiondev/enums';
import type { ConnectorChainMismatchError } from '@wagmi/core';
import type { Config } from 'wagmi';
import type { GetWalletClientParameters, GetWalletClientReturnType } from 'wagmi/actions';

import { SwitchChainError } from '@/constants/error.js';
import { openAndWaitForCloseWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/refs.js';

function resolveExpectChainId(error: ConnectorChainMismatchError) {
    const chainId = error.message.match(/Expected Chain ID: (\d+)/);
    return chainId ? Number(chainId[1]) : undefined;
}

export type OpenProps = WalletConnectModalOpenProps & { silent?: boolean };

export async function getWalletClientRequired(
    config: Config,
    clientParameters?: GetWalletClientParameters,
    openProps?: OpenProps,
): Promise<Exclude<GetWalletClientReturnType, null>> {
    // Loaded lazily so wagmi is not pulled into the static graph of the many
    // (login / lens / metrics) modules that call this helper — keeping wagmi out
    // of whiteboard first paint.
    const { getWalletClient } = await import('wagmi/actions');
    const { ConnectorChainMismatchError, ConnectorNotConnectedError } = await import('@wagmi/core');
    // @dimensiondev/web3/actions re-exports wagmi-core-backed helpers, so it is
    // loaded lazily too to keep wagmi out of whiteboard first paint.
    const { switchEthereumChain } = await import('@dimensiondev/web3/actions');
    const { chains } = await import('@dimensiondev/web3/chains');

    try {
        await getWalletClient(config, clientParameters);
    } catch (error) {
        if (error instanceof ConnectorNotConnectedError) {
            const { silent, ...modalOptions } = openProps || {};
            if (silent) throw error;
            await openAndWaitForCloseWalletConnectModal({
                ...modalOptions,
                networkType: NetworkType.Ethereum,
            });
        } else if (error instanceof ConnectorChainMismatchError) {
            const expectedChainId = clientParameters?.chainId || resolveExpectChainId(error);
            if (expectedChainId) {
                // starting from wagmi/core 2.2, the validation of chains will be strict.
                await switchEthereumChain(config, expectedChainId);
            } else {
                throw error;
            }
        } else {
            throw error;
        }
    }

    const client = await getWalletClient(config, clientParameters);
    if (!clientParameters?.chainId) return client;

    if (clientParameters.chainId !== (await client.getChainId())) {
        await switchEthereumChain(config, clientParameters.chainId);
        if (clientParameters.chainId !== (await client.getChainId())) {
            const chainName = chains.find((x) => x.id === clientParameters?.chainId)?.name;
            if (chainName) throw new SwitchChainError(chainName);
            else throw new SwitchChainError();
        }
    }

    return client;
}
