import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton, CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';

interface FormOptions {
    name: string;
    symbol: string;
    address: string;
}

export interface LaunchTokenModalOpenProps {
    onConfirm: (result: FormOptions) => void;
    onCancel?: () => void;
}

export type LaunchTokenModalCloseResult = void;
type Props = {
    ref: React.Ref<SingletonModalRefCreator<LaunchTokenModalOpenProps>>;
};

export function LaunchTokenModal({ ref }: Props) {
    const [props, setProps] = useState<LaunchTokenModalOpenProps>();
    const invalidAddressMessage = t`Invalid wallet address format`;
    const schema = useMemo(() => {
        return z.object({
            name: z.string().min(1),
            symbol: z.string().min(1),
            address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, invalidAddressMessage),
        });
    }, [invalidAddressMessage]);
    const {
        register,
        handleSubmit,
        setValue,
        setFocus,
        watch,
        formState: { errors, isValid },
        reset,
    } = useForm<FormOptions>({
        resolver: zodResolver(schema),
        reValidateMode: 'onBlur',
        defaultValues: {
            name: '',
            symbol: '',
            address: '',
        },
    });

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps({ ...props });
            reset();
        },
        onClose: () => setProps(undefined),
    });

    const { name, symbol, address } = watch();

    if (!props) return null;

    return (
        <Modal
            disableBackdropClose
            open={open}
            onClose={() => {
                props.onCancel?.();
                dispatch?.close();
            }}
        >
            <div className="relative flex w-[355px] flex-col rounded-xl bg-bgModal shadow-popover transition-all dark:text-gray-950">
                <div className="inline-flex h-auto w-full items-center justify-center gap-4 rounded-t-[12px] p-4">
                    <CloseButton
                        onClick={() => {
                            props.onCancel?.();
                            dispatch?.close();
                        }}
                    />
                    <div className="shrink grow basis-0 truncate text-center text-lg font-bold leading-snug text-main">
                        <Trans>Launch Token</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>

                <form
                    className="flex flex-1 flex-col gap-3 p-6 pt-0"
                    onSubmit={handleSubmit((data) => {
                        props.onConfirm(data);
                        dispatch?.close();
                    })}
                >
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-3">
                            <span className="self-start text-sm font-bold leading-[18px] text-main">
                                <Trans>Token name</Trans>
                            </span>

                            <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                                <input
                                    type="text"
                                    autoFocus
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="w-full border-0 bg-transparent px-3 py-[11px] leading-[18px] placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm"
                                    placeholder={t`My MEME coin on BNB`}
                                    {...register('name', { required: true })}
                                />
                                {name ? (
                                    <ClearButton
                                        tabIndex={-1}
                                        type="button"
                                        className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                        IconProps={{
                                            className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                        }}
                                        size={16}
                                        onClick={() => {
                                            setValue('name', '');
                                            setFocus('name');
                                        }}
                                    />
                                ) : null}
                            </div>
                        </label>
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-3">
                            <span className="self-start text-sm font-bold leading-[18px] text-main">
                                <Trans>Token symbol</Trans>
                            </span>
                            <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                                <input
                                    type="text"
                                    autoFocus
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="w-full border-0 bg-transparent px-3 py-[11px] leading-[18px] placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm"
                                    placeholder={t`$meme`}
                                    {...register('symbol', {
                                        required: true,
                                        setValueAs: (v) => {
                                            if (!v) return v;
                                            return v.startsWith('$') ? v : `$${v}`;
                                        },
                                    })}
                                />
                                {symbol ? (
                                    <ClearButton
                                        tabIndex={-1}
                                        type="button"
                                        className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                        IconProps={{
                                            className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                        }}
                                        size={16}
                                        onClick={() => {
                                            setValue('symbol', '');
                                            setFocus('symbol');
                                        }}
                                    />
                                ) : null}
                            </div>
                        </label>
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-3">
                            <span className="self-start text-sm font-bold leading-[18px] text-main">
                                <Trans>BNB address</Trans>
                            </span>
                            <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                                <input
                                    type="text"
                                    autoFocus
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="w-full border-0 bg-transparent px-3 py-[11px] leading-[18px] placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm"
                                    placeholder={t`BNB wallet to receive trading fees`}
                                    {...register('address', { required: true })}
                                />
                                {address ? (
                                    <ClearButton
                                        tabIndex={-1}
                                        type="button"
                                        className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                        IconProps={{
                                            className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                        }}
                                        size={16}
                                        onClick={() => {
                                            setValue('address', '');
                                            setFocus('address');
                                        }}
                                    />
                                ) : null}
                            </div>
                        </label>
                        {errors.address ? (
                            <div className="self-start text-xs font-medium text-danger">{errors.address.message}</div>
                        ) : null}
                    </div>
                    <div className="mt-3 flex flex-col-reverse gap-4">
                        <ClickableButton
                            enableDefault
                            enablePropagate
                            className="flex flex-1 items-center justify-center rounded-full bg-main py-2 font-bold text-primaryBottom disabled:cursor-not-allowed disabled:opacity-50"
                            type="submit"
                            disabled={!isValid}
                        >
                            <Trans>Post to launch</Trans>
                        </ClickableButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
