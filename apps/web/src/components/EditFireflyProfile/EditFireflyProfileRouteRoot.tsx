'use client';

import { Outlet, rootRouteId, useRouteContext } from '@tanstack/react-router';
import { FormProvider, useForm } from 'react-hook-form';

export interface EditFireflyProfileFromValues {
    avatar?: File;
    displayName: string;
}

export function EditFireflyProfileRouteRoot() {
    const context = useRouteContext({ from: rootRouteId });
    const form = useForm<EditFireflyProfileFromValues>({
        defaultValues: {
            displayName: context.profile?.displayName,
        },
        mode: 'onChange',
    });

    return (
        <FormProvider {...form}>
            <Outlet />
        </FormProvider>
    );
}
