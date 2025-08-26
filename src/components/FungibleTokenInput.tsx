import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { type ChangeEvent, memo, useCallback, useMemo } from 'react';

import ArrowDown from '@/assets/arrow-down.svg';
import { TokenIcon } from '@/components/TokenIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { NUMERIC_INPUT_REGEXP_PATTERN } from '@/constants/regexp.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isSameAddress, isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { ETH_ZERO_ADDRESS, isZeroAddressEthereum, isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { isZero, leftShift } from '@/helpers/number.js';
import { TokenSelectorModalRef } from '@/modals/TokenSelectorModal.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';

const MIN_AMOUNT_LENGTH = 1;
const MAX_AMOUNT_LENGTH = 79;

interface FungibleTokenInputProps {
    token?: FungibleToken<number, number>;
    placeholder?: string;
    onTokenChange: (token: FungibleToken<number, number>) => void;
    amount: string;
    maxAmount?: string;
    maxAmountShares?: number;
    onAmountChange: (amount: string) => void;
    balance: string;
    networkType: NetworkType;
    account: string;
}

export const FungibleTokenInput = memo<FungibleTokenInputProps>(function FungibleTokenInput({
    token,
    onTokenChange,
    onAmountChange,
    maxAmountShares = 1,
    maxAmount,
    balance,
    amount,
    placeholder,
    networkType,
    account,
}) {
    const handleTokenChange = useCallback(async () => {
        if (!account) return;
        const picked = await TokenSelectorModalRef.openAndWaitForClose({
            networkType,
            address: account,
            isSelected: (item) => {
                switch (networkType) {
                    case NetworkType.Ethereum:
                        return (
                            isSameEthereumAddress(
                                isValidAddressEthereum(item.id) ? item.id : ETH_ZERO_ADDRESS,
                                token?.address,
                            ) && item.chainId === token?.chainId
                        );
                    case NetworkType.Solana:
                        return isSameAddress(item.id, token?.address);
                    default:
                        return false;
                }
            },
            initialAddTokenChainId: token?.chainId,
        });
        if (!picked) return;
        onTokenChange(picked);
    }, [account, token, networkType, onTokenChange]);

    const isSolana = networkType === NetworkType.Solana;
    const isNativeToken = isSolana ? isZeroAddressSolana(token?.address) : isZeroAddressEthereum(token?.address);

    const { RE_MATCH_WHOLE_AMOUNT, RE_MATCH_FRACTION_AMOUNT } = useMemo(
        () => ({
            RE_MATCH_FRACTION_AMOUNT: new RegExp(`^\\.\\d{0,${token?.decimals}}$`),
            RE_MATCH_WHOLE_AMOUNT: new RegExp(`^\\d*\\.?\\d{0,${token?.decimals}}$`), // d.ddd...d
        }),
        [token?.decimals],
    );
    const onChange = useCallback(
        (ev: ChangeEvent<HTMLInputElement>) => {
            const amount_ = ev.currentTarget.value.replaceAll(',', '.');
            if (RE_MATCH_FRACTION_AMOUNT.test(amount_)) onAmountChange(`0${amount_}`);
            else if (amount_ === '' || RE_MATCH_WHOLE_AMOUNT.test(amount_)) onAmountChange(amount_);
        },
        [onAmountChange, RE_MATCH_WHOLE_AMOUNT, RE_MATCH_FRACTION_AMOUNT],
    );

    const onMaxClick = useCallback(() => {
        if (!token) return;
        const amount = new BigNumber(maxAmount ?? balance).dividedBy(maxAmountShares).decimalPlaces(0, 1);
        const formattedBalance = formatBalance(amount, token.decimals, {
            significant: token.decimals,
            isPrecise: true,
            hasSeparators: false,
        });

        onAmountChange(
            (isZero(formattedBalance)
                ? new BigNumber(leftShift(amount, token.decimals).toPrecision(2)).toFormat()
                : formattedBalance) ?? '0',
        );
    }, [token, maxAmount, balance, maxAmountShares, onAmountChange]);

    return (
        <div className="rounded-xl border border-transparent bg-bg px-3 py-[10px] focus-within:border-highlight focus-within:bg-primaryBottom">
            <div className="flex items-center justify-end gap-x-1 text-[13px] leading-[18px]">
                <label className="text-secondary">
                    {isNativeToken ? <Trans>Available Balance</Trans> : <Trans>Balance</Trans>}
                </label>
                <span className="font-bold text-main">{formatBalance(balance, token?.decimals) ?? '0'}</span>
                <div
                    className="cursor-pointer rounded-full bg-highlight px-[6px] py-[2px] text-[10px] font-bold leading-[14px] text-white"
                    onClick={onMaxClick}
                >
                    <Trans>MAX</Trans>
                </div>
            </div>

            <div className="mt-2 flex items-center">
                <input
                    value={amount}
                    onChange={onChange}
                    className="flex-1 border-0 border-transparent bg-transparent px-0 placeholder-secondary outline-transparent focus:border-0 focus:outline-0 focus:ring-0"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder={placeholder ?? t`Total amount shared among all winners`}
                    inputMode="decimal"
                    min={0}
                    minLength={MIN_AMOUNT_LENGTH}
                    maxLength={MAX_AMOUNT_LENGTH}
                    pattern={NUMERIC_INPUT_REGEXP_PATTERN}
                />

                {token ? (
                    <div className="flex cursor-pointer items-center gap-x-3" onClick={handleTokenChange}>
                        <TokenIcon key={token.id} chainId={token.chainId} name={token.name} icon={token.logoURL} />
                        <span className="text-sm font-bold leading-[18px]">{token.symbol}</span>
                        <ArrowDown width={24} height={24} />
                    </div>
                ) : null}
            </div>
        </div>
    );
});
