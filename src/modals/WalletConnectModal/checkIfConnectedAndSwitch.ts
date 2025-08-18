import { getConnectors, switchAccount } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import type { NetworkType } from '@/constants/enum.js';
import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import type { ConnectorWithProvider } from '@/types/utility.js';

export async function checkIfConnectedAndSwitch(
    connector: ConnectorWithProvider,
    connectedId: Array<{ networkType: NetworkType; id: string }>,
) {
    const connectedRecord =
        !!connector.chain &&
        connectedId.find(
            (x) =>
                networkTypeToChainNamespace(x.networkType) === connector.chain &&
                [connector.id, connector.name].includes(x.id),
        );
    if (!connectedRecord) return false;

    if (connector.chain === 'eip155') {
        const wagmiConnectors = getConnectors(wagmiConfig);
        const wagmiConnector = wagmiConnectors.find((x) => x.id === connectedRecord.id);
        if (wagmiConnector) {
            await switchAccount(wagmiConfig, { connector: wagmiConnector });
        }
    }

    WalletConnectModalRef.close({ networkType: connectedRecord.networkType });

    return true;
}
