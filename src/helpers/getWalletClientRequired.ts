import { ConnectorNotConnectedError } from '@wagmi/core';
import type { Config } from 'wagmi';
import { getWalletClient, type GetWalletClientParameters, type GetWalletClientReturnType } from 'wagmi/actions';

import { chains } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { SwitchChainError } from '@/constants/error.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/index.jsx';

export async function getWalletClientRequired(
    config: Config,
    clientParameters?: GetWalletClientParameters,
    openProps?: WalletConnectModalOpenProps,
): Promise<Exclude<GetWalletClientReturnType, null>> {
    try {
        await getWalletClient(config, clientParameters);
    } catch (error) {
        if (error instanceof ConnectorNotConnectedError) {
            await WalletConnectModalRef.openAndWaitForClose({
                ...openProps,
                networkType: NetworkType.Ethereum,
            });
        } else {
            throw error;
        }
    }

    const client = await getWalletClient(config, clientParameters);
    if (clientParameters?.chainId && clientParameters.chainId !== (await client.getChainId())) {
        await switchEthereumChain(clientParameters.chainId);
        if (clientParameters?.chainId !== (await client.getChainId())) {
            const chainName = chains.find((x) => x.id === clientParameters?.chainId)?.name;
            if (chainName) throw new SwitchChainError(chainName);
            else throw new SwitchChainError();
        }
    }

    return client;
}
