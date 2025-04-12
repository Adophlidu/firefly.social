'use client';

import { Dialog } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { Outlet, rootRouteId, useLocation, useRouteContext, useRouter } from '@tanstack/react-router';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import LeftArrowIcon from '@/assets/left-arrow.svg';
import { Path } from '@/components/EditFireflyProfile/EditFireflyProfileRouter.js';
import { CloseButton } from '@/components/IconButton.js';

export interface EditFireflyProfileFromValues {
    avatar?: File;
    displayName: string;
}

export function EditFireflyProfileRouteRoot() {
    const context = useRouteContext({ from: rootRouteId });
    const { history } = useRouter();
    const { pathname } = useLocation();
    const titles: Record<string, JSX.Element> = {
        [Path.Root]: <Trans>Edit Profile</Trans>,
        [Path.AvatarEditor]: <Trans>Edit Image</Trans>,
    };
    const form = useForm<EditFireflyProfileFromValues>({
        defaultValues: {
            displayName: context.profile?.displayName,
        },
        mode: 'onChange',
    });

    return (
        <div className="relative flex w-[100vw] flex-grow flex-col overflow-auto bg-lightBottom shadow-popover transition-all dark:bg-darkBottom dark:text-gray-950 md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:flex-grow-0">
            <Dialog.Title as="h3" className="relative h-14 shrink-0 pt-safe">
                {pathname === Path.Root ? (
                    <CloseButton
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-fourMain"
                        onClick={context.onClose}
                    />
                ) : (
                    <LeftArrowIcon
                        onClick={() => history.replace(Path.Root)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-fourMain"
                    />
                )}
                <span className="flex h-full w-full items-center justify-center gap-x-1 text-lg font-bold capitalize text-fourMain">
                    {titles[pathname] ?? titles[Path.Root]}
                </span>
            </Dialog.Title>
            <FormProvider {...form}>
                <Outlet />
            </FormProvider>
        </div>
    );
}
