import { CoreConnectorController } from '@reown/appkit';

import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import type { SourceWalletEventParameters, WalletEventParameters } from '@/providers/types/Telemetry.js';

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

export function getSourceWalletEventParameters(address: string) {
    return {
        source_wallet_type: getConnectorWalletType(address),
        source_wallet_address: address,
        source_wallet_name: getConnectorWalletName(address),
    } satisfies Omit<SourceWalletEventParameters, 'firefly_account_id'>;
}
