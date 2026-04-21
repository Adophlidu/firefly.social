import { switchEthereumChain } from '@dimensiondev/web3/actions';
import { chains } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { ConnectorChainMismatchError, ConnectorNotConnectedError } from '@wagmi/core';
import type { Config } from 'wagmi';
import { getWalletClient, type GetWalletClientParameters, type GetWalletClientReturnType } from 'wagmi/actions';

import { SwitchChainError } from '@/constants/error.js';
import { type WalletConnectModalOpenProps, WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';

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
    try {
        await getWalletClient(config, clientParameters);
    } catch (error) {
        if (error instanceof ConnectorNotConnectedError) {
            const { silent, ...modalOptions } = openProps || {};
            if (silent) throw error;
            await WalletConnectModalRef.openAndWaitForClose({
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
