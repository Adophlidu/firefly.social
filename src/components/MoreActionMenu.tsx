import { classNames } from '@dimensiondev/utils';
import { Menu, MenuButton, type MenuButtonProps, type MenuProps, Transition } from '@headlessui/react';
import { type ElementType, Fragment, type MouseEvent, type ReactNode } from 'react';

import { type SocialSource } from '@/constants/enum.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';

interface MoreActionMenuProps extends MenuProps<'div'> {
    button: ReactNode;
    children: ReactNode;
    source?: SocialSource;
    className?: string;
    /** @deprecated use buttonProps.className */
    buttonClassName?: string;
    disabled?: boolean;
    loginRequired?: boolean;
    buttonProps?: Omit<MenuButtonProps, 'as' | 'className'> & { as?: ElementType; className?: string };
}

export function MoreActionMenu({
    disabled,
    button,
    children,
    className,
    buttonClassName,
    source,
    loginRequired = true,
    buttonProps,
}: MoreActionMenuProps) {
    const isLogin = useIsLogin();
    const { walletProfile } = useFireflyIdentityState();

    if (walletProfile?.hacked) return null;

    return (
        <Menu className={classNames('relative', className)} as="div" onClick={stopEvent}>
            <MenuButton
                disabled={disabled}
                className={classNames(
                    'flex shrink-0 items-center text-lightMain transition duration-100 active:scale-90',
                    buttonProps?.className,
                    buttonClassName,
                )}
                aria-label="More"
                onClick={(event: MouseEvent) => {
                    event.stopPropagation();
                    if (!isLogin && loginRequired) {
                        event.preventDefault();
                        openLoginModal({ source });
                        return;
                    }
                }}
                {...buttonProps}
            >
                {button}
            </MenuButton>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform-gpu opacity-0 scale-95"
                enterTo="transform-gpu opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform-gpu opacity-100 scale-100"
                leaveTo="transform-gpu opacity-0 scale-95"
            >
                {children}
            </Transition>
        </Menu>
    );
}
