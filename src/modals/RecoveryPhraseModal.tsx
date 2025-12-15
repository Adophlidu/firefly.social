'use client';

import { Trans } from '@lingui/react/macro';
import { type Ref, useState } from 'react';
import { useAsyncFn } from 'react-use';

import CopyIcon from '@/assets/copy.svg';
import EyeSlashIcon from '@/assets/eye-slash.svg';
import KeySquareIcon from '@/assets/key-square.svg';
import ShieldSecurityIcon from '@/assets/shield-security.svg';
import Warning2Icon from '@/assets/warning-2.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { getFarMnemonicByFid } from '@/providers/firefly/endpoint/getFarMnemonicByFid.js';

interface RecoveryPhraseModalOpenProps {
    fid: string;
}

type RecoveryPhraseModalCloseResult = boolean | null;

interface Props {
    ref: Ref<SingletonModalRefCreator<RecoveryPhraseModalOpenProps, RecoveryPhraseModalCloseResult>>;
}

export function RecoveryPhraseModal({ ref }: Props) {
    const [props, setProps] = useState<RecoveryPhraseModalOpenProps>();
    const [showPhrase, setShowPhrase] = useState(false);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
            setShowPhrase(false);
        },
        onClose: () => {
            setProps(undefined);
            setShowPhrase(false);
        },
    });

    const [{ loading, value: mnemonic = [] }, handleConfirm] = useAsyncFn(async () => {
        if (!props?.fid) {
            throw new Error('fid is required');
        }

        try {
            const mnemonic = await getFarMnemonicByFid(props.fid);
            if (!mnemonic.length) throw new Error('Failed to get recovery phrase. Please try again.');

            setShowPhrase(true);
            return mnemonic;
        } catch (error) {
            enqueueErrorMessage(<Trans>Failed to get recovery phrase. Please try again.</Trans>, { error });
            throw error;
        }
    }, [props?.fid]);

    const mnemonicText = mnemonic?.join(' ') ?? '';
    const [copied, handleCopy] = useCopyText(mnemonicText, { enqueueSuccessMessage: true });

    const handleClose = () => {
        dispatch?.close(null);
    };

    const getColumnWords = (startIndex: number) => {
        return mnemonic?.slice(startIndex, startIndex + 8) ?? [];
    };

    if (!props) return null;

    return (
        <Modal open={open} onClose={handleClose} disableBackdropClose>
            <div className="relative flex w-[455px] max-w-[90vw] flex-col gap-6 rounded-xl bg-white p-6 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.1)] dark:bg-bgModal">
                <ModalTitle
                    title={<Trans>Your Recovery Phrase</Trans>}
                    enableClose
                    onClose={handleClose}
                    className="!p-0"
                />

                {!showPhrase ? (
                    <>
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex size-[60px] items-center justify-center">
                                <ShieldSecurityIcon width={60} height={60} className="text-danger" />
                            </div>

                            <div className="flex w-full flex-col gap-1 px-10">
                                <h3 className="text-center text-lg font-semibold leading-normal text-second">
                                    <Trans>Keep Your Recovery Phrase Safe</Trans>
                                </h3>

                                <div className="flex w-full flex-col gap-2">
                                    <div className="flex w-full items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center">
                                            <KeySquareIcon width={24} height={24} className="text-danger" />
                                        </div>
                                        <p className="flex-1 text-left text-sm font-semibold leading-5 text-main">
                                            <Trans>Your recovery phrase is like a password, keep it secret.</Trans>
                                        </p>
                                    </div>

                                    <div className="flex w-full items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center">
                                            <EyeSlashIcon width={24} height={24} className="text-danger" />
                                        </div>
                                        <p className="flex-1 text-left text-sm font-semibold leading-5 text-main">
                                            <Trans>
                                                If you enter it in another app, it can steal your funds and Farcaster
                                                account.
                                            </Trans>
                                        </p>
                                    </div>

                                    <div className="flex w-full items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center">
                                            <Warning2Icon width={24} height={24} className="text-danger" />
                                        </div>
                                        <p className="flex-1 text-left text-sm font-semibold leading-5 text-main">
                                            <Trans>We do not recommend ever sharing it with any app or person.</Trans>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full">
                            <ClickableButton
                                className="hover:bg-commonDanger/90 flex h-10 w-full items-center justify-center rounded-full bg-commonDanger px-[18px] py-[11px] font-bold text-white transition-colors"
                                onClick={handleConfirm}
                                disabled={loading}
                                loading={loading}
                                aria-label="I understand"
                            >
                                <Trans>I understand</Trans>
                            </ClickableButton>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center">
                                <Warning2Icon width={24} height={24} className="text-danger" />
                            </div>
                            <p className="text-sm font-semibold leading-5 text-danger">
                                <Trans>Keep it safe and do not share</Trans>
                            </p>
                        </div>

                        <div className="flex items-start justify-between gap-2 rounded-2xl border border-line px-6 py-3">
                            <div className="flex w-[60px] flex-col gap-1">
                                {getColumnWords(0).map((word: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 text-sm font-semibold leading-[21px]"
                                    >
                                        <span className="text-second">{String(index + 1).padStart(2, '0')}</span>
                                        <span className="text-main">{word}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex w-[60px] flex-col gap-1">
                                {getColumnWords(8).map((word: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 text-sm font-semibold leading-[21px]"
                                    >
                                        <span className="text-second">{String(index + 9).padStart(2, '0')}</span>
                                        <span className="text-main">{word}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex w-[60px] flex-col gap-1">
                                {getColumnWords(16).map((word: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 text-sm font-semibold leading-[21px]"
                                    >
                                        <span className="text-second">{String(index + 17).padStart(2, '0')}</span>
                                        <span className="text-main">{word}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex w-full justify-center">
                            <ClickableButton
                                className="flex items-center gap-1 rounded-xl p-1 text-sm font-semibold leading-[18px] text-second transition-colors hover:bg-bg"
                                onClick={() => handleCopy()}
                                aria-label={copied ? 'Copied' : 'Copy recovery phrase to clipboard'}
                            >
                                <CopyIcon width={16} height={16} />
                                <span>{copied ? <Trans>Copied</Trans> : <Trans>Copy to clipboard</Trans>}</span>
                            </ClickableButton>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export const RecoveryPhraseModalRef = new SingletonModal<
    RecoveryPhraseModalOpenProps,
    RecoveryPhraseModalCloseResult
>();
