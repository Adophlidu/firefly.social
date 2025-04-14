import { t } from '@lingui/core/macro';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import { ClickableButton } from '@/components/ClickableButton.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveCurrentFireflyAccountId, resolveFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveNetworkProvider, resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { TipsContext } from '@/hooks/useTipsContext.js';
import { useTipsValidation } from '@/hooks/useTipsValidation.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { captureTipsSendEvent } from '@/providers/telemetry/captureTipsSendEvent.js';
import { reportTokenTips, UploadTokenTipsToken } from '@/services/reportTokenTips.js';

interface SendTipsButtonProps {
    connected: boolean;
    onConnect: () => void;
}

const SendTipsButton = memo<SendTipsButtonProps>(function SendTipsButton({ connected, onConnect }) {
    const { token, recipient, amount, update, identity } = TipsContext.useContainer();
    const { value, loading: isValidating, error } = useTipsValidation();

    const [{ loading: isSending }, handleSendTips] = useAsyncFn(async () => {
        if (!connected) {
            onConnect();
            return;
        }
        try {
            if (!recipient || !token) return;
            update((prev) => ({ ...prev, hash: null, isSending: true }));
            const { chainId, id } = token;
            const transfer = resolveTransferProvider(recipient.networkType);
            const network = resolveNetworkProvider(recipient.networkType);
            const hash = await transfer.transfer({
                to: recipient.address,
                token,
                amount,
            });
            const hashUrl = network.getTransactionUrl(chainId, hash) ?? network.getAddressUrl(chainId, id);
            if (hashUrl) {
                update((prev) => ({ ...prev, hash: hashUrl }));
            }

            {
                const [account, fromAccountId, toAccountId] = await Promise.all([
                    network.getAccount(),
                    resolveCurrentFireflyAccountId(),
                    resolveFireflyAccountId(identity),
                ]);

                const chainName = resolveWagmiChain(token.chainId)?.name || token.chain;
                reportTokenTips({
                    from_account_id: fromAccountId,
                    to_account_id: toAccountId,
                    from_address: account,
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
                captureTipsSendEvent({
                    wallet_address: account,
                    target_wallet_address: recipient.address,
                    target_firefly_account_id: toAccountId ?? '',
                    amount,
                    currency: token.symbol,
                    amount_usd: token.usdValue,
                    chain_id: token.chainId,
                    chain_name: chainName,
                });
            }

            enqueueSuccessMessage(t`Tip sent successfully!`);
            router.navigate({ to: TipsRoutePath.SUCCESS });
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to send tip.`);
            throw error;
        } finally {
            update((prev) => ({ ...prev, isSending: false }));
        }
    }, [connected, onConnect, recipient, token, update, amount, identity]);

    return (
        <ClickableButton
            className="mt-6 flex h-10 w-full items-center justify-center rounded-[20px] bg-lightMain text-lightBottom dark:text-darkBottom"
            disabled={!connected ? false : isValidating || isSending || !!value?.disabled || !!error}
            onClick={handleSendTips}
            loading={isSending || isValidating}
            onlyLoading={isValidating}
        >
            {!connected
                ? t`Connect Wallet`
                : isSending
                  ? t`Sending`
                  : error
                    ? t`Validate failed, please check your input.`
                    : value?.label}
        </ClickableButton>
    );
});

export function SendWithEVM() {
    const account = useAccount();
    const onConnect = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
    }, []);

    return <SendTipsButton connected={account.isConnected} onConnect={onConnect} />;
}

export function SendWithSolana() {
    const { connection } = useAppKitConnection();

    const onConnect = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Solana });
    }, []);

    return <SendTipsButton connected={!!connection} onConnect={onConnect} />;
}
