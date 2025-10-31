import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { useEnsName } from 'wagmi';

import { ClickableArea } from '@/components/ClickableArea.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';

function formatAccountName(account?: string) {
    if (!account) return account;
    if (isValidAddressEthereum(account) || isValidAddressSolana(account)) return formatAddress(account, 4);
    if (isValidDomainEthereum(account)) return account;
    return `@${account}`;
}

function ShareAccountsPopoverItem({
    icon,
    name,
    onClick,
    disabled = false,
}: {
    icon: ReactNode;
    name: string;
    onClick: (name: string) => void;
    disabled?: boolean;
}) {
    const { data: ensName } = useEnsName({
        address: name as `0x${string}`,
        query: {
            enabled: isValidAddressEthereum(name),
        },
    });

    return (
        <ClickableArea
            className={classNames('shrink-0', {
                'cursor-pointer': !disabled,
                'opacity-40': disabled,
            })}
            onClick={() => {
                onClick(name);
            }}
        >
            <div className="box-content flex h-12 items-center justify-between px-3 hover:bg-bg">
                <div className="flex items-center gap-2 text-main">
                    {icon}
                    <span className="font-bold text-main">{formatAccountName(ensName ?? name)}</span>
                </div>
            </div>
        </ClickableArea>
    );
}

interface ShareAccountsPopoverProps extends PropsWithChildren {
    accounts: Array<{ icon: ReactNode; name: string }>;
    onSelect: (name: string) => void;
    className?: string;
    selected?: string;
}

export function ShareAccountsPopover({ accounts, children, onSelect, className, selected }: ShareAccountsPopoverProps) {
    return (
        <Popover as="div" className="relative">
            {({ close }) => (
                <>
                    <PopoverButton
                        className={classNames(
                            'flex cursor-pointer gap-1 text-main focus:outline-none disabled:cursor-default',
                            className,
                        )}
                    >
                        {children}
                    </PopoverButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            anchor="bottom"
                            portal
                            modal
                            className="absolute bottom-full right-0 z-10 w-[280px] -translate-y-3"
                        >
                            <div className="flex flex-col gap-2 overflow-y-auto rounded-lg bg-lightBottom py-3 text-medium shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none">
                                {accounts.map(({ icon, name }) => (
                                    <ShareAccountsPopoverItem
                                        key={name}
                                        icon={icon}
                                        name={name}
                                        disabled={selected === name}
                                        onClick={(name: string) => {
                                            onSelect(name);
                                            close();
                                        }}
                                    />
                                ))}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
