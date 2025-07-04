import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash-es';
import { type HTMLProps, type ReactNode, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAsyncFn } from 'react-use';

import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import InfoIcon from '@/assets/info-outline.svg';
import SearchIcon from '@/assets/search.svg';
import WalletIcon from '@/assets/wallet.fill.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { TokenIcon } from '@/components/Tips/TokenIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import type { Token } from '@/providers/types/Transfer.js';

interface FormValues {
    to: string;
    amount: string;
}

type EstimateGasFn = (
    values: Partial<FormValues>,
    token: Token,
) => Promise<{
    amount: string;
    usd: string | number;
    symbol: string;
} | void>;

type ValidateFn = (
    values: Partial<FormValues>,
    token: Token,
) => Promise<{
    error?: ReactNode;
} | void>;

export interface SendTransactionModalContentProps extends Omit<HTMLProps<'form'>, 'onSubmit'> {
    token: Token;
    recipient?: RecipientItemProps;
    onClickSearch?: (keyword: string) => void;
    onClickChangeToken?: () => void;
    onSubmit?: (values: FormValues, token: Token) => void;
    estimateGas?: EstimateGasFn;
    validate?: ValidateFn;
    setMaxAmount?: (token: Token) => Promise<string>;
}

export function SendTransactionModalContent({
    token,
    recipient,
    onClickSearch,
    onClickChangeToken,
    onSubmit,
    className,
    estimateGas,
    validate,
    setMaxAmount,
}: SendTransactionModalContentProps) {
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { isSubmitting, isValid },
        control,
    } = useForm<FormValues>({
        defaultValues: {
            to: recipient?.address ?? '',
            amount: '',
        },
        mode: 'onChange',
    });

    const [isFocusingAddressInput, setIsFocusingAddressInput] = useState(false);
    const watching = useWatch({
        control,
    });

    const { data: estimatedGas, isLoading: isEstimatingGas } = useQuery({
        queryKey: ['estimateGas', token, watching.to, watching.amount, estimateGas],
        queryFn() {
            return estimateGas?.(watching, token);
        },
        enabled: !!token && !!estimateGas,
    });

    useEffect(() => {
        if (recipient) {
            setValue('to', recipient.address, { shouldValidate: true });
        } else if (getValues('to')) {
            setValue('to', '', { shouldValidate: true });
        }
    }, [getValues, recipient, setValue]);

    useEffect(() => {
        const textareaEl = document.getElementById('send-transaction-recipient') as HTMLTextAreaElement;
        if (!textareaEl) return;
        function adjustTextareaHeight() {
            const el = textareaEl;
            el.style.height = '1px';
            el.style.height = `${el.scrollHeight}px`;
        }
        adjustTextareaHeight();
        textareaEl.addEventListener('input', adjustTextareaHeight);
        textareaEl.addEventListener('change', adjustTextareaHeight);
        textareaEl.addEventListener('focus', adjustTextareaHeight);
        textareaEl.addEventListener('blur', adjustTextareaHeight);
        return () => {
            textareaEl.removeEventListener('input', adjustTextareaHeight);
            textareaEl.removeEventListener('change', adjustTextareaHeight);
            textareaEl.removeEventListener('focus', adjustTextareaHeight);
            textareaEl.removeEventListener('blur', adjustTextareaHeight);
        };
    }, []);

    const showRecipient = recipient && !isOnlyAddress(recipient) && recipient?.address === watching.to;

    const { data: validatedResult, isLoading: isValidating } = useQuery({
        queryKey: ['validate-transfer', validate, watching, token],
        queryFn() {
            return validate?.(watching, token);
        },
    });

    const [{ loading: isSettingMaxAmount }, onSetMaxAmount] = useAsyncFn(async () => {
        if (!setMaxAmount) return;
        const balance = await setMaxAmount(token);
        setValue('amount', balance, { shouldValidate: true });
    }, [setMaxAmount, setValue, token]);

    return (
        <form
            className={classNames('flex w-full flex-col items-center gap-4', className)}
            onSubmit={handleSubmit((values) => onSubmit?.(values, token))}
        >
            <div className="flex w-full flex-col items-start space-y-3">
                <ClickableButton
                    className="flex w-full justify-between rounded-xl bg-line p-4"
                    onClick={onClickChangeToken}
                >
                    <div className="flex items-center gap-x-4">
                        <TokenIcon token={token} tokenSize={36} />
                        <div className="flex flex-col space-y-1 text-left text-medium">
                            <span className="h-[18px] leading-[18px]">{token.name}</span>
                            <span className="h-3.5 text-[13px] leading-[14px] text-second">
                                <Trans>
                                    Balance: {token.balance || '0'} {token.symbol || '-'}
                                </Trans>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <ArrowDownIcon width={18} height={18} />
                    </div>
                </ClickableButton>
                <div className="text-sm font-medium">
                    <Trans>To</Trans>
                </div>
                <div className="relative flex w-full rounded-xl bg-line focus-within:bg-primaryBottom focus-within:ring-1 focus-within:ring-highlight">
                    {showRecipient ? (
                        <div
                            className={classNames(
                                'pointer-events-none absolute left-0 top-0 flex w-full cursor-text p-4 duration-100',
                                {
                                    'opacity-0': isFocusingAddressInput,
                                },
                            )}
                        >
                            <RecipientItem {...omit(recipient, 'handle')} />
                        </div>
                    ) : null}
                    <label
                        htmlFor="send-transaction-recipient"
                        className={classNames('flex w-full cursor-text items-center p-4 duration-100', {
                            'opacity-0': !!showRecipient && !isFocusingAddressInput,
                        })}
                    >
                        <div className="border-line2 flex size-9 items-center justify-center rounded-lg border bg-primaryBottom">
                            <WalletIcon width={24} height={24} className="text-third" />
                        </div>
                        <textarea
                            id="send-transaction-recipient"
                            {...register('to', {
                                required: true,
                                onBlur() {
                                    setIsFocusingAddressInput(false);
                                },
                            })}
                            onFocus={() => setIsFocusingAddressInput(true)}
                            className="max-h-9 min-h-[18px] flex-1 resize-none border-none bg-transparent p-0 pl-3 text-medium font-medium leading-[18px] text-main placeholder:text-second focus:!shadow-none focus:!outline-none focus:!ring-transparent"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            placeholder={t`Enter or search for a recipient wallet`}
                        />
                    </label>
                    <ClickableButton
                        onClick={() => onClickSearch?.(watching.to ?? '')}
                        type="button"
                        className="relative z-10 flex h-full items-center justify-center p-4 pl-0"
                    >
                        <span className="flex size-9 items-center justify-center">
                            <SearchIcon width={18} height={18} />
                        </span>
                    </ClickableButton>
                </div>
                {recipient && isSocialRecipient(recipient) ? (
                    <div className="flex items-center space-x-3 rounded-2xl border border-current p-3 text-left text-[13px] font-medium leading-5 text-warn">
                        <InfoIcon width={24} height={24} className="shrink-0" />
                        <div>
                            <Trans>
                                Please note that the wallet address related to social account may be inaccurate or
                                subject to change. Be sure to verify the address before sending.
                            </Trans>
                        </div>
                    </div>
                ) : null}
                <div className="text-sm font-medium">
                    <Trans>Amount</Trans>
                </div>
                <div className="flex w-full flex-col space-y-1">
                    <label
                        htmlFor="send-transaction-amount"
                        className="flex cursor-text items-center rounded-xl bg-line p-4 pl-2 duration-100 focus-within:bg-primaryBottom focus-within:ring-1 focus-within:ring-highlight"
                    >
                        <input
                            id="send-transaction-amount"
                            type="number"
                            {...register('amount', {
                                required: true,
                                min: 0,
                            })}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            step="any"
                            min={0}
                            inputMode="decimal"
                            className="no-spinner h-9 flex-1 border-none bg-transparent p-0 pl-3 text-medium text-main placeholder:text-second focus:!shadow-none focus:!outline-none focus:!ring-transparent"
                            placeholder={t`Enter amount`}
                        />
                        {setMaxAmount ? (
                            <ClickableButton
                                onClick={onSetMaxAmount}
                                loading={isSettingMaxAmount}
                                onlyLoading
                                type="button"
                                className="flex size-9 items-center justify-center text-medium font-semibold uppercase text-highlight"
                            >
                                <Trans>Max</Trans>
                            </ClickableButton>
                        ) : null}
                    </label>
                </div>
                {estimateGas ? (
                    <div className="flex h-[18px] w-full flex-row justify-between text-sm leading-[18px]">
                        <div className="font-normal text-second">
                            <Trans>Network cost</Trans>
                        </div>
                        {isEstimatingGas ? (
                            <LoadingIcon size={16} />
                        ) : (
                            <div className="font-medium">
                                {estimatedGas
                                    ? `${formatPrice(estimatedGas.amount)} ${estimatedGas.symbol}  ≈ $${formatPrice(estimatedGas.usd)}`
                                    : '-'}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
            <div className="mt-auto w-full">
                <ActionButton
                    className="h-10 w-full rounded-lg text-medium"
                    type="submit"
                    disabled={isSubmitting || !!validatedResult?.error || isValidating || isEstimatingGas || !isValid}
                >
                    {isValidating || isSubmitting ? (
                        <LoadingIcon size={20} />
                    ) : (
                        (validatedResult?.error ?? <Trans>Send</Trans>)
                    )}
                </ActionButton>
            </div>
        </form>
    );
}

function isOnlyAddress(recipient: RecipientItemProps) {
    return Object.keys(recipient).length === 1 && 'address' in recipient;
}

function isSocialRecipient(recipient: RecipientItemProps) {
    return !!recipient.source;
}
