import { CoreConnectorController } from '@reown/appkit';

import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { type WalletEventParameters } from '@/providers/types/Telemetry.js';

function getConnectorWalletType(address: string) {
    if (isValidAddressEthereum(address)) return 'evm';
    if (isValidAddressSolana(address)) return 'solana';
    return 'unknown';
}

function getConnectorWalletName(address: string) {
    return CoreConnectorController.state.activeConnector?.name ?? 'unknown';
}

export function getWalletEventParameters(address: string) {
    return {
        wallet_type: getConnectorWalletType(address),
        wallet_address: address.toLowerCase(),
        wallet_name: getConnectorWalletName(address),
    } satisfies Omit<WalletEventParameters, 'firefly_account_id'>;
}
