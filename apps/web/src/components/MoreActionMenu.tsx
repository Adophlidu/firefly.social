import type { SocialSource } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Menu, MenuButton, type MenuButtonProps, type MenuProps, Transition } from '@headlessui/react';
import { type ElementType, Fragment, type MouseEvent, type ReactNode, useEffect } from 'react';

import { openLoginModal } from '@/helpers/openLoginModal.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';

export interface MoreActionMenuRenderContext {
    open: boolean;
    close: () => void;
}

interface MoreActionMenuBaseProps extends Omit<MenuProps<'div' | 'span'>, 'children' | 'as' | 'className'> {
    source?: SocialSource;
    className?: string;
    /** Class on the `Menu` root. */
    menuClassName?: string;
    /** Headless `Menu` element; default `div`. */
    menuAs?: 'div' | 'span';
    /** `onClick` on the `Menu` root; defaults to `stopEvent`. */
    menuOnClick?: (event: MouseEvent) => void;
    disabled?: boolean;
    loginRequired?: boolean;
    /**
     * When `true` (default), the panel is wrapped in the app’s standard `Transition`.
     * Set to `false` if the panel uses `MenuItems transition` or supplies its own `Transition`.
     */
    useTransition?: boolean;
    /** @deprecated use buttonProps.className */
    buttonClassName?: string;
    /**
     * Content inside the default `MenuButton` (ignored when `menuButton` or `renderMenu` is set).
     */
    button?: ReactNode;
    /**
     * Replaces the default `MenuButton`+`button` pattern (e.g. a fully custom `MenuButton`).
     */
    menuButton?: ReactNode;
    buttonProps?: Omit<MenuButtonProps, 'as' | 'className'> & { as?: ElementType; className?: string };
    /**
     * `Menu` render-prop API: you render trigger + panel. `button` / `menuButton` / `useTransition` are not used.
     */
    renderMenu?: (ctx: MoreActionMenuRenderContext) => ReactNode;
    /**
     * Panel only (or pass a function to receive `open` / `close` for the panel), when not using `renderMenu`.
     */
    children?: ReactNode | ((ctx: MoreActionMenuRenderContext) => ReactNode);
    /** Notifies when the menu opens or closes (replaces ad-hoc `useEffect` on `open`). */
    onMenuOpenChange?: (open: boolean) => void;
}

type MoreActionMenuProps = MoreActionMenuBaseProps & {
    className?: string;
};

function MenuOpenSync({ open, onChange }: { open: boolean; onChange?: (open: boolean) => void }) {
    useEffect(() => {
        onChange?.(open);
    }, [open, onChange]);
    return null;
}

function renderPanelChildren(
    children: MoreActionMenuBaseProps['children'],
    ctx: MoreActionMenuRenderContext,
): ReactNode {
    if (typeof children === 'function') {
        return children(ctx);
    }
    return children;
}

export function MoreActionMenu({
    disabled,
    button,
    children,
    className,
    menuClassName,
    buttonClassName,
    source,
    loginRequired = true,
    buttonProps,
    renderMenu,
    useTransition = true,
    menuAs = 'div',
    menuOnClick = stopEvent,
    menuButton,
    onMenuOpenChange,
}: MoreActionMenuProps) {
    const isLogin = useIsLogin();
    const { walletProfile } = useFireflyIdentityState();

    if (walletProfile?.hacked) return null;

    if (renderMenu) {
        return (
            <Menu as={menuAs} className={classNames('relative', className, menuClassName)} onClick={menuOnClick}>
                {({ open, close }) => (
                    <>
                        {onMenuOpenChange ? <MenuOpenSync open={open} onChange={onMenuOpenChange} /> : null}
                        {renderMenu({ open, close })}
                    </>
                )}
            </Menu>
        );
    }

    const {
        className: buttonClassFromProps,
        onClick: buttonOnClickFromProps,
        as: _as,
        ...restButtonProps
    } = buttonProps ?? {};
    const mergedButtonClass = classNames(
        'text-lightMain flex shrink-0 items-center transition duration-100 active:scale-90',
        buttonClassFromProps,
        buttonClassName,
    );

    const handleMenuButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!isLogin && loginRequired) {
            event.preventDefault();
            openLoginModal({ source });
        }
        buttonOnClickFromProps?.(event);
    };

    return (
        <Menu as={menuAs} className={classNames('relative', className, menuClassName)} onClick={menuOnClick}>
            {({ open, close }) => {
                const ctx: MoreActionMenuRenderContext = { open, close };
                const panel = useTransition ? (
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform-gpu opacity-0 scale-95"
                        enterTo="transform-gpu opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform-gpu opacity-100 scale-100"
                        leaveTo="transform-gpu opacity-0 scale-95"
                    >
                        {renderPanelChildren(children, ctx)}
                    </Transition>
                ) : (
                    renderPanelChildren(children, ctx)
                );

                return (
                    <>
                        {onMenuOpenChange ? <MenuOpenSync open={open} onChange={onMenuOpenChange} /> : null}
                        {menuButton ? (
                            menuButton
                        ) : (
                            <MenuButton
                                disabled={disabled}
                                className={mergedButtonClass}
                                aria-label="More"
                                onClick={handleMenuButtonClick}
                                {...restButtonProps}
                            >
                                {button}
                            </MenuButton>
                        )}
                        {panel}
                    </>
                );
            }}
        </Menu>
    );
}
