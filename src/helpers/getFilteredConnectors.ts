import { type ConnectorWithProviders, CoreApiController, CoreConnectorController, type WcWallet } from '@reown/appkit';

function isMatched(wallet: WcWallet, connector: ConnectorWithProviders) {
    return (
        (!!connector.id && connector.id === wallet.id) ||
        (!!connector.info?.rdns && connector.info.rdns === wallet.rdns)
    );
}

export function getFilteredConnectors(
    connectors = CoreConnectorController.state.connectors || [],
    featureWallets = CoreApiController.state.featured || [],
) {
    return connectors.filter((connector) => {
        if (connector.id === 'walletConnect') return true;

        return featureWallets.some(
            (wallet) =>
                isMatched(wallet, connector) ||
                (connector.connectors?.length && connector.connectors.some((c) => isMatched(wallet, c))),
        );
    });
}
