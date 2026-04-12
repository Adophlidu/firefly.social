import FireflyLogo from '@dimensiondev/assets/firefly.logo.svg';
import { parseUrl } from '@dimensiondev/utils';
import { Transition } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo, type ReactNode } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import type { FrameV2 } from '@/types/frame.js';

interface PopoverProps {
    open: boolean;
    onClose: () => void;
    frame?: FrameV2;
    title?: ReactNode;
    content?: ReactNode;
}

export const Popover = memo(function Popover({ frame, open, onClose, title, content }: PopoverProps) {
    const url = frame?.button.action.url || frame?.x_url;
    const u = url ? parseUrl(url) : null;

    return (
        <Transition appear show={open} as="div">
            <div className="absolute inset-0 top-[60px] flex flex-col items-center justify-end overflow-auto">
                <Transition.Child
                    as="div"
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="bg-main/25 absolute inset-0 bg-opacity-30"
                        onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            onClose?.();
                        }}
                    />
                </Transition.Child>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300 transform"
                    enterFrom="translate-y-full"
                    enterTo="translate-y-0"
                    leave="ease-in duration-200 transform"
                    leaveFrom="translate-y-0"
                    leaveTo="translate-y-full"
                >
                    <div className="bg-lightBottom dark:bg-darkBottom relative z-10 max-h-[600px] w-full rounded-t-xl">
                        <div className="border-line flex items-center border-b p-3">
                            {frame?.button.action.splashImageUrl ? (
                                <Image
                                    className="mr-2 rounded-xl"
                                    alt={frame.button.action.name}
                                    src={frame.button.action.splashImageUrl}
                                    width={42}
                                    height={42}
                                />
                            ) : (
                                <FireflyLogo className="mr-2 rounded-xl" width={42} height={42} />
                            )}
                            <div className="text-left">
                                <h2 className="text-sm font-bold">{title}</h2>
                                {u ? (
                                    <p className="text-secondary mt-1 text-xs">
                                        <Trans>
                                            Requested from{' '}
                                            <Link className="text-fireflyBrand" href={u.href}>
                                                {u.host}
                                            </Link>
                                        </Trans>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="p-3">{content}</div>
                    </div>
                </Transition.Child>
            </div>
        </Transition>
    );
});
