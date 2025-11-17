import { resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { captureTipsSendEvent } from '@/providers/telemetry/captureTipsEvent.js';
import type { FireflyTipsProfile } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { Token } from '@/providers/types/Transfer.js';
import { reportTokenTips, UploadTokenTipsToken } from '@/services/reportTokenTips.js';

interface ReportOptions {
    eventId: EventId.TIPS_SEND_SUBMIT | EventId.TIPS_SEND_SUCCESS;
    fromAccountId: string | undefined;
    toAccountId: string | undefined;
    address: string;
    recipient: FireflyTipsProfile;
    token: Token;
    amount: string;
    hash: string;
    isCustomAmount: boolean;
}

export async function reportAndCaptureTipEvent({
    eventId,
    fromAccountId,
    toAccountId,
    address,
    recipient,
    token,
    amount,
    hash,
    isCustomAmount,
}: ReportOptions) {
    try {
        const chainName = resolveWagmiChain(token.chainId)?.name || token.chain;
        const transfer = resolveTransferProvider(recipient.networkType);

        if (eventId === EventId.TIPS_SEND_SUCCESS) {
            await reportTokenTips({
                from_account_id: fromAccountId,
                to_account_id: toAccountId,
                from_address: address,
                to_address: recipient.address,
                chain_id: `${token.chainId}`,
                chain_name: chainName,
                amount,
                token_symbol: token.symbol,
                token_icon: token.logo_url,
                token_address: token.id,
                token_type: transfer.isNativeToken(token)
                    ? UploadTokenTipsToken.NativeToken
                    : UploadTokenTipsToken.ERC20,
                tip_memos: '',
                tx_hash: hash,
            });
        }
        await captureTipsSendEvent(eventId, {
            wallet_address: address,
            target_wallet_address: recipient.address,
            target_firefly_account_id: toAccountId ?? '',
            amount,
            currency: token.symbol,
            amount_usd: token.usdValue,
            chain_id: token.chainId,
            chain_name: chainName,
            is_custom_amount: isCustomAmount,
        });
    } catch {
        console.warn('Failed to report and capture tip event');
    }
}
