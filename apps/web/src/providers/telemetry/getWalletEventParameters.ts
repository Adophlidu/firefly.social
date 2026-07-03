import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import type { ConnectorController } from '@reown/appkit-controllers';

import type { WalletEventParameters } from '@/providers/types/Telemetry.js';

// @reown/appkit-controllers is loaded lazily so it stays out of the static import
// graph of the ubiquitous profile/telemetry UI that reaches this helper — keeping
// it off whiteboard first paint (e.g. /signup). Until it resolves (or on routes
// without the wallet stack) the wallet name falls back to 'unknown', which is
// correct when no wallet is connected.
let connectorController: typeof ConnectorController | undefined;

function ensureConnectorController() {
    if (!connectorController) {
        void import('@reown/appkit-controllers').then((module) => {
            connectorController = module.ConnectorController;
        });
    }
    return connectorController;
}

function getConnectorWalletType(address: string) {
    if (isValidAddressEthereum(address)) return 'evm';
    if (isValidAddressSolana(address)) return 'solana';
    return 'unknown';
}

function getConnectorWalletName() {
    return ensureConnectorController()?.state.activeConnector?.name ?? 'unknown';
}

export function getWalletEventParameters(address: string) {
    return {
        wallet_type: getConnectorWalletType(address),
        wallet_address: address.toLowerCase(),
        wallet_name: getConnectorWalletName(),
    } satisfies Omit<WalletEventParameters, 'firefly_account_id'>;
}
