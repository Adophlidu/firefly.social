'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useMatch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { EstimatedCost } from '@/components/Tips/EstimatedCost.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isZero, ZERO } from '@/helpers/number.js';
import { resolveNetworkProvider, resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { trimify } from '@/helpers/trimify.js';
import { TipsContext } from '@/hooks/useTipsContext.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { reportAndCaptureTipEvent } from '@/services/reportAndCaptureTipEvent.js';

interface SendTipsButtonProps {
    connected: boolean;
    onConnect: () => void;
}

const SendTipsButton = memo<SendTipsButtonProps>(function SendTipsButton({ connected, onConnect }) {
    const { context } = useMatch({ from: rootRouteId });
    const {
        token,
        recipient,
        tokenAmount: amount,
        update,
        identity,
        amount: customAmount,
        showLoadingView,
        showFailedView,
    } = TipsContext.useContainer();

    const {
        data: value,
        isLoading,
        isRefetching,
        error,
    } = useQuery({
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryKey: ['tips-validate', recipient?.networkType, recipient?.address, token?.chainId, token?.id, amount],
        queryFn: async () => {
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

            const isBalanceValid = token.custom
                ? true
                : await transfer.validateBalance({
                      to: recipient.address,
                      token,
                      amount,
                  });
            if (!isBalanceValid) {
                return { label: <Trans>Insufficient Balance</Trans>, disabled: true };
            }

            // ! The calculation of gas fee is not accurate on Solana, such as the fee for creating ATA is not included.
            const { isValid, gas } =
                recipient.networkType === NetworkType.Solana
                    ? { isValid: true, gas: ZERO }
                    : await transfer.validateGas({
                          to: recipient.address,
                          token,
                          amount,
                      });
            if (isValid) return { label: <Trans>Send</Trans>, disabled: false, gas };
            return { label: <Trans>Insufficient Balance for Gas Fee</Trans>, disabled: true, gas };
        },
    });

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
            await transfer.waitForTransaction(hash, token.chainId);
            reportAndCaptureTipEvent(
                identity,
                await network.getAccount(),
                recipient,
                token,
                amount,
                hash,
                !!customAmount,
            );

            enqueueSuccessMessage(t`Tip sent successfully!`);
            router.navigate({ to: TipsRoutePath.SUCCESS });
            update((prev) => ({ ...prev, isSending: false, hasError: false }));
        } catch (error) {
            update((prev) => ({ ...prev, hasError: true, isSending: false, hash: null }));
            enqueueMessageFromError(error, t`Failed to send tip.`);
            throw error;
        }
    }, [connected, onConnect, recipient, token, update, amount, identity, customAmount]);

    const isValidating = isLoading || isRefetching;
    const disabled = !connected ? false : isValidating || isSending || !!value?.disabled;

    if (showLoadingView) {
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

    if (showFailedView) {
        return (
            <motion.button
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-lightMain font-bold text-lightBottom dark:text-darkBottom"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    update((prev) => ({ ...prev, hash: null, hasError: false }));
                }}
            >
                <Trans>Try again</Trans>
            </motion.button>
        );
    }

    return (
        <>
            <EstimatedCost gas={value?.gas || ZERO} />
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
                    <Trans>Send</Trans>
                ) : (
                    value?.label
                )}
                {isSending || isValidating ? <LoadingIcon size={20} /> : null}
            </motion.button>
        </>
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
