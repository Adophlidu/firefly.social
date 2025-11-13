import { ConnectorChainMismatchError, ConnectorNotConnectedError } from '@wagmi/core';
import type { Config } from 'wagmi';
import { getWalletClient, type GetWalletClientParameters, type GetWalletClientReturnType } from 'wagmi/actions';

import { chains } from '@/configs/chains.js';
import { NetworkType } from '@/constants/enum.js';
import { SwitchChainError } from '@/constants/error.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';

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
        } else if (error instanceof ConnectorChainMismatchError && clientParameters?.chainId) {
            // starting from wagmi/core 2.2, the validation of chains will be strict.
            await switchEthereumChain(clientParameters.chainId);
        } else {
            throw error;
        }
    }

    const client = await getWalletClient(config, clientParameters);
    if (!clientParameters?.chainId) return client;

    if (clientParameters.chainId !== (await client.getChainId())) {
        await switchEthereumChain(clientParameters.chainId);
        if (clientParameters.chainId !== (await client.getChainId())) {
            const chainName = chains.find((x) => x.id === clientParameters?.chainId)?.name;
            if (chainName) throw new SwitchChainError(chainName);
            else throw new SwitchChainError();
        }
    }

    return client;
}
