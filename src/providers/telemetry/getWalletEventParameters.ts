import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import type { WalletEventParameters } from '@/providers/types/Telemetry.js';
import { CoreConnectorController } from '@reown/appkit';
import { isAddress } from 'viem';

export function getConnectorWalletType(address: string) {
    if (isAddress(address)) return 'evm';
    if (isValidSolanaAddress(address)) return 'solana';
    return 'unknown';
}

export function getConnectorWalletName(address: string) {
    return CoreConnectorController.state.activeConnector?.name ?? 'unknown';
}

export function getWalletEventParameters(address: string) {
    return {
        wallet_type: getConnectorWalletType(address),
        wallet_address: address,
        wallet_name: getConnectorWalletName(address),
    } satisfies Omit<WalletEventParameters, 'firefly_account_id'>;
}
