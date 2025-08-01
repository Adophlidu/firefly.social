import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import SearchIcon from '@/assets/search.svg';
import { BaseNotFound } from '@/components/BaseNotFound.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';

type Recipient = RecipientItemProps | RecipientItemProps[];

export interface SelectRecipientModalProps {
    open?: boolean;
    onClose?: () => void;
    onQuery?: (keyword: string) => void;
    onSelect?: (item: RecipientItemProps) => void;
    recipients?: Recipient[];
    isLoading?: boolean;
    initialKeyword?: string;
}

export function SelectRecipientModal({ open, onClose, onSelect, ...props }: SelectRecipientModalProps) {
    const [chooseWalletRecipients, setChooseWalletRecipients] = useState<RecipientItemProps[]>([]);
    const [isOpenChooseWalletModal, setIsOpenChooseWalletModal] = useState(false);

    return (
        <>
            <ChooseWalletModal
                recipients={chooseWalletRecipients}
                open={isOpenChooseWalletModal}
                onClose={() => setIsOpenChooseWalletModal(false)}
                onSelect={(x) => {
                    setIsOpenChooseWalletModal(false);
                    onSelect?.(x);
                }}
            />
            <Modal open={!!open && !isOpenChooseWalletModal} onClose={() => onClose?.()} dialogClassName="z-50">
                <div className="z-50 flex min-h-[404px] w-[calc(100%-40px)] max-w-[432px] flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[508px] md:rounded-xl">
                    <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                        <CloseButton
                            onClick={() => onClose?.()}
                            className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                        />
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                            <Trans>Recipient</Trans>
                        </span>
                    </DialogTitle>
                    <ModalContent
                        {...props}
                        onSelect={onSelect}
                        setChooseWalletRecipients={setChooseWalletRecipients}
                        setIsOpenChooseWalletModal={setIsOpenChooseWalletModal}
                    />
                </div>
            </Modal>
        </>
    );
}

function ModalContent({
    recipients,
    onSelect,
    onQuery,
    isLoading,
    initialKeyword = '',
    setChooseWalletRecipients,
    setIsOpenChooseWalletModal,
}: Omit<SelectRecipientModalProps, 'open' | 'onClose'> & {
    setChooseWalletRecipients: (items: RecipientItemProps[]) => void;
    setIsOpenChooseWalletModal: (state: boolean) => void;
}) {
    const [keyword, setKeyword] = useState(initialKeyword);
    useEffect(() => {
        onQuery?.(keyword);
    }, [keyword, onQuery]);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex w-full items-center rounded-lg border border-transparent bg-lightBg px-3 transition-all focus-within:border-highlight">
                <SearchIcon width={18} height={18} className="mr-2 shrink-0 text-second" />
                <input
                    className="h-10 w-full border-0 bg-transparent px-0 py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                    placeholder={t`Address, ENS, or social handle`}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>
            {isLoading && !recipients?.length ? (
                <div className="flex w-full flex-1 items-center justify-center">
                    <LoadingIcon />
                </div>
            ) : recipients?.length ? (
                <div className="mt-2 flex w-full flex-1 flex-col space-y-2 overflow-y-auto">
                    {recipients?.map((recipient, i) => {
                        if (Array.isArray(recipient)) {
                            if (!recipient[0]) return null;
                            return (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    key={i}
                                    className="w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-bg"
                                    onClick={() => {
                                        setChooseWalletRecipients(recipient);
                                        setIsOpenChooseWalletModal(true);
                                    }}
                                >
                                    <RecipientItem {...recipient[0]} explorerLink showSources />
                                </div>
                            );
                        }
                        return (
                            <div
                                role="button"
                                tabIndex={0}
                                key={i}
                                className="w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-bg"
                                onClick={() => onSelect?.(recipient)}
                            >
                                <RecipientItem {...recipient} explorerLink showSources />
                            </div>
                        );
                    })}
                </div>
            ) : keyword ? (
                <BaseNotFound className="!border-0">
                    <div className="mt-11 text-sm font-bold">
                        <Trans>The address could not be found.</Trans>
                    </div>
                </BaseNotFound>
            ) : null}
        </div>
    );
}

function ChooseWalletModal({
    open = false,
    recipients,
    onClose,
    onSelect,
}: {
    open?: boolean;
    recipients?: RecipientItemProps[];
    onClose?: () => void;
    onSelect?: (recipient: RecipientItemProps) => void;
}) {
    return (
        <Modal open={open} onClose={() => onClose?.()} dialogClassName="z-50">
            <div className="z-50 flex w-[calc(100%-40px)] max-w-[432px] flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[508px] md:rounded-xl">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <CloseButton
                        onClick={() => onClose?.()}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Recipient</Trans>
                    </span>
                </DialogTitle>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {recipients?.map((recipient, i) => {
                        return (
                            <button
                                type="button"
                                key={i}
                                className="w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-bg"
                                onClick={() => onSelect?.(recipient)}
                            >
                                <RecipientItem
                                    address={recipient.address}
                                    ens={recipient.ens}
                                    explorerLink
                                    showSources
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
}
