import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SendWithEVM, SendWithSolana } from '@/components/Tips/SendTipsButton.js';
import { TipsModalHeader } from '@/components/Tips/TipsModalHeader.js';
import { TokenSelectorEntry } from '@/components/Tips/TokenSelector.js';
import { WalletSelectorEntry } from '@/components/Tips/WalletSelector.js';
import { NetworkType } from '@/constants/enum.js';
import { NUMERIC_INPUT_REGEXP_PATTERN } from '@/constants/regexp.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveNetworkProvider, resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { useAccountByNetwork } from '@/hooks/useAccountByNetwork.js';
import { TipsContext } from '@/hooks/useTipsContext.js';

export const TipsUI = memo(function TipsUI() {
    const [focus, setFocus] = useState(false);
    const { token, recipient, amount, handle, isSending, pureWallet, update } = TipsContext.useContainer();
    const { isConnected } = useAccountByNetwork(recipient?.networkType);

    const { RE_MATCH_WHOLE_AMOUNT, RE_MATCH_FRACTION_AMOUNT } = useMemo(
        () => ({
            RE_MATCH_FRACTION_AMOUNT: new RegExp(`^\\.\\d{0,${token?.decimals ?? 18}}$`),
            RE_MATCH_WHOLE_AMOUNT: new RegExp(`^\\d*\\.?\\d{0,${token?.decimals ?? 18}}$`),
        }),
        [token?.decimals],
    );

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        if (value && !new RegExp(NUMERIC_INPUT_REGEXP_PATTERN).test(value)) return;
        const amount_ = value.replaceAll(/[,。]/g, '.');
        if (RE_MATCH_FRACTION_AMOUNT.test(amount_)) {
            update((prev) => ({ ...prev, amount: `0${amount_}` }));
        } else if (amount_ === '' || RE_MATCH_WHOLE_AMOUNT.test(amount_)) {
            update((prev) => ({ ...prev, amount: amount_ }));
        }
    };

    const [{ loading }, handleUseMaxBalance] = useAsyncFn(async () => {
        if (!recipient || !token) return;
        const network = resolveNetworkProvider(recipient.networkType);
        const account = await network.getAccount();
        if (!account) return;
        const transfer = resolveTransferProvider(recipient.networkType);
        const balance = await transfer.getAvailableBalance({
            to: recipient.address,
            token,
            amount,
        });
        update((prev) => ({ ...prev, amount: balance }));
    }, [amount, recipient, token, update]);

    const actionDisabled = isSending || !isConnected;

    return (
        <>
            <TipsModalHeader
                title={
                    recipient ? (
                        pureWallet ? (
                            <Trans>Send a tip</Trans>
                        ) : (
                            <Trans>Send a tip to @{handle || recipient.displayName}</Trans>
                        )
                    ) : null
                }
            />
            <div className="font-bold">
                <WalletSelectorEntry disabled={isSending} />
                <div className="mt-3 flex gap-x-3">
                    <div
                        className={classNames(
                            'flex h-10 flex-1 items-center rounded-2xl bg-lightBg pr-3',
                            actionDisabled ? 'opacity-50' : '',
                        )}
                    >
                        <input
                            className="h-full w-full border-none bg-transparent text-center outline-none focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
                            placeholder={focus ? '' : t`Enter amount`}
                            value={amount}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            onChange={handleAmountChange}
                            onFocus={() => setFocus(true)}
                            onBlur={() => setFocus(false)}
                            disabled={actionDisabled}
                            inputMode="decimal"
                            pattern={NUMERIC_INPUT_REGEXP_PATTERN}
                        />
                        {token && recipient ? (
                            <ClickableButton
                                className="whitespace-nowrap font-bold text-highlight"
                                disabled={isSending || loading}
                                onClick={handleUseMaxBalance}
                            >
                                {loading ? <LoadingIcon /> : <Trans>Max</Trans>}
                            </ClickableButton>
                        ) : null}
                    </div>
                    <TokenSelectorEntry disabled={actionDisabled} />
                </div>
                {recipient ? (
                    recipient.networkType === NetworkType.Ethereum ? (
                        <SendWithEVM />
                    ) : (
                        <SendWithSolana />
                    )
                ) : null}
            </div>
        </>
    );
});
