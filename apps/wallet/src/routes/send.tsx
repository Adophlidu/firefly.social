import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { type FormValues, SendTokenContext } from '@/components/SendTransactionModal/types.js';
import { type Token } from '@/providers/types/Transfer.js';

export const Route = createFileRoute('/send')({
    component: SendLayout,
});

function SendLayout() {
    const [token, setToken] = useState<Token | null>(null);
    const methods = useForm<FormValues>({
        defaultValues: {
            to: '',
            amount: '',
        },
        mode: 'onChange',
    });

    return (
        <div className="flex min-h-screen w-full flex-col">
            <SendTokenContext.Provider value={{ token, setToken }}>
                <FormProvider {...methods}>
                    <Outlet />
                </FormProvider>
            </SendTokenContext.Provider>
        </div>
    );
}
