import { FreeGasTxType } from '@/providers/types/FreeGas.js';

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
const ERC20_APPROVE_SELECTOR = '0x095ea7b3';
const CREATE_RED_PACKET_SELECTOR = '0x5db05aba';

/**
 * Decode the transaction type from calldata by inspecting the 4-byte function selector.
 * Recognised selectors: ERC20 `transfer`, `approve`, and red packet `create_red_packet`.
 */
export function decodeFreeGasTxType(data?: string): FreeGasTxType | null {
    if (!data || data.length < 10) return null;

    const selector = data.slice(0, 10).toLowerCase();

    if (selector === ERC20_TRANSFER_SELECTOR) return FreeGasTxType.TokenTransfer;
    if (selector === ERC20_APPROVE_SELECTOR) return FreeGasTxType.TokenApprove;
    if (selector === CREATE_RED_PACKET_SELECTOR) return FreeGasTxType.RedpacketSend;

    return null;
}
