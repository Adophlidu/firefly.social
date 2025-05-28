import type { NetworkType } from '@/constants/enum.js';
import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import type { ConnectorWithProvider } from '@/types/index.js';

export function isWalletConnected(
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

    return connectedRecord;
}
