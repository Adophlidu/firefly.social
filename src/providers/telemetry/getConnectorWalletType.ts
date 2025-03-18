import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
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
