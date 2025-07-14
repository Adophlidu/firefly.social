import { resolveCurrentFireflyAccountId, resolveFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import type { TipsProfile } from '@/hooks/useTipsContext.js';
import { captureTipsSendEvent } from '@/providers/telemetry/captureTipsSendEvent.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';
import { reportTokenTips, UploadTokenTipsToken } from '@/services/reportTokenTips.js';

export async function reportAndCaptureTipEvent(
    identity: FireflyIdentity,
    address: string,
    recipient: TipsProfile,
    token: Token,
    amount: string,
    hash: string,
) {
    try {
        const [fromAccountId, toAccountId] = await Promise.all([
            resolveCurrentFireflyAccountId(),
            resolveFireflyAccountId(identity),
        ]);
        const chainName = resolveWagmiChain(token.chainId)?.name || token.chain;
        const transfer = resolveTransferProvider(recipient.networkType);

        reportTokenTips({
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
            token_type: transfer.isNativeToken(token) ? UploadTokenTipsToken.NativeToken : UploadTokenTipsToken.ERC20,
            tip_memos: '',
            tx_hash: hash,
        });
        captureTipsSendEvent({
            wallet_address: address,
            target_wallet_address: recipient.address,
            target_firefly_account_id: toAccountId ?? '',
            amount,
            currency: token.symbol,
            amount_usd: token.usdValue,
            chain_id: token.chainId,
            chain_name: chainName,
        });
    } catch {
        console.warn('Failed to report and capture tip event');
    }
}
