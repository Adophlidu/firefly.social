import type { ReactNode } from 'react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { type FormValues, SendTokenContext } from '@/components/SendTransactionModal/types.js';
import type { Token } from '@/providers/types/Transfer.js';

export default function SendLayout({ children }: { children?: ReactNode }) {
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
                <FormProvider {...methods}>{children}</FormProvider>
            </SendTokenContext.Provider>
        </div>
    );
}
