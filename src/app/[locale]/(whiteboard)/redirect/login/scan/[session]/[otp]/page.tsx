'use client';

import FireflyIcon from '@dimensiondev/assets/logo.svg';
import { useRouter } from 'next/navigation.js';
import { use } from 'react';

import { usePollingAppScanLogin } from '@/hooks/usePollingAppScanLogin.js';
import { type LayoutProps } from '@/types/utility.js';

export default function Page({
    params,
}: LayoutProps<{
    session: string;
    otp: string;
}>) {
    const router = useRouter();
    const { session, otp } = use(params);

    usePollingAppScanLogin(otp, session, {
        onSuccess() {
            router.push('/');
        },
        onCancel() {
            router.push('/');
        },
        onExpired() {
            router.push('/');
        },
        onFailure() {
            router.push('/');
        },
    });

    return (
        <div className="fixed inset-0 z-10 flex h-screen items-center justify-center">
            <FireflyIcon className="size-24 animate-pulse" />
        </div>
    );
}
