'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { rootRouteId, useMatch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import type { Hash } from 'viem';
import { useAccount } from 'wagmi';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isZero } from '@/helpers/number.js';
import { resolveNetworkProvider, resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { trimify } from '@/helpers/trimify.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { TipsContext } from '@/hooks/useTipsContext.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { reportAndCaptureTipEvent } from '@/services/reportAndCaptureTipEvent.js';

interface SendTipsButtonProps {
    connected: boolean;
    onConnect: () => void;
}

const SendTipsButton = memo<SendTipsButtonProps>(function SendTipsButton({ connected, onConnect }) {
    const { context } = useMatch({ from: rootRouteId });
    const { token, recipient, tokenAmount: amount, update, identity, hasError, hash } = TipsContext.useContainer();

    const {
        value,
        loading: isValidating,
        error,
    } = useAsync(async () => {
        if (token && !token.price && !amount) {
            return {
                label: <Trans>Custom amount is required for this token</Trans>,
                disabled: true,
            };
        }

        if (!recipient || !token || !trimify(amount) || isZero(trimify(amount))) {
            return { label: <Trans>Send</Trans>, disabled: true };
        }

        const transfer = resolveTransferProvider(recipient.networkType);
        const network = resolveNetworkProvider(recipient.networkType);

        if (isSameAddress(recipient.address, await network.getAccount())) {
            return { label: <Trans>Cannot send tip to yourself</Trans>, disabled: true };
        }

        const isBalanceValid = await transfer.validateBalance({
            to: recipient.address,
            token,
            amount,
        });
        if (!isBalanceValid) {
            return { label: <Trans>Insufficient Balance</Trans>, disabled: true };
        }

        const isGasValid = await transfer.validateGas({
            to: recipient.address,
            token,
            amount,
        });
        if (isGasValid) return { label: <Trans>Send</Trans>, disabled: false };
        return { label: <Trans>Insufficient Balance for Gas Fee</Trans>, disabled: true };
    }, [recipient, token, amount]);

    const [{ loading: isSending }, handleSendTips] = useAsyncFn(async () => {
        if (!connected) {
            onConnect();
            return;
        }
        try {
            if (!recipient || !token) return;

            update((prev) => ({ ...prev, hash: null, isSending: true, hasError: false }));
            const transfer = resolveTransferProvider(recipient.networkType);
            const network = resolveNetworkProvider(recipient.networkType);
            const hash = await transfer.transfer({
                to: recipient.address,
                token,
                amount,
            });
            update((prev) => ({ ...prev, hash }));
            if (recipient.networkType === NetworkType.Ethereum) {
                await waitForEthereumTransaction(token.chainId, hash as Hash);
            } else if (recipient.networkType === NetworkType.Solana) {
                // TODO: Implement wait for Solana transaction
                throw new NotImplementedError();
            }
            reportAndCaptureTipEvent(identity, await network.getAccount(), recipient, token, amount, hash);

            enqueueSuccessMessage(t`Tip sent successfully!`);
            router.navigate({ to: TipsRoutePath.SUCCESS });
            update((prev) => ({ ...prev, isSending: false, hasError: false }));
        } catch (error) {
            update((prev) => ({ ...prev, hasError: true, isSending: false, hash: null }));
            enqueueMessageFromError(error, t`Failed to send tip.`);
            throw error;
        }
    }, [connected, onConnect, recipient, token, update, amount, identity]);

    const disabled = !connected ? false : isValidating || isSending || !!value?.disabled || !!error;

    if (isSending && !hasError && hash) {
        return (
            <motion.button
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-lightMain font-bold text-lightBottom dark:text-darkBottom"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    context.onClose();
                }}
            >
                <Trans>Done</Trans>
            </motion.button>
        );
    }

    if (!isSending && hasError) {
        return (
            <motion.button
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-lightMain font-bold text-lightBottom dark:text-darkBottom"
                whileTap={{ scale: 0.98 }}
                onClick={handleSendTips}
            >
                <Trans>Try again</Trans>
            </motion.button>
        );
    }

    return (
        <motion.button
            className={classNames(
                'mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-lightMain font-bold text-lightBottom dark:text-darkBottom',
                disabled ? 'cursor-not-allowed opacity-50' : '',
            )}
            disabled={disabled}
            whileTap={{ scale: 0.98 }}
            onClick={handleSendTips}
        >
            {isValidating ? null : !connected ? (
                <Trans>Connect Wallet</Trans>
            ) : isSending ? (
                <Trans>Sending</Trans>
            ) : error ? (
                <Trans>Validate failed, please check your input.</Trans>
            ) : (
                value?.label
            )}
            {isSending || isValidating ? <LoadingIcon size={20} /> : null}
        </motion.button>
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
