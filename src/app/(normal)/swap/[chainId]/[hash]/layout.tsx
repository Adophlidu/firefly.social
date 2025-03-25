import type { PropsWithChildren } from 'react';
import type { NextPageProps } from '@/types/index.js';
import { Comeback } from '@/components/Comeback.js';
import { Trans } from '@lingui/react/macro';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { notFound } from 'next/navigation.js';
import type { Address } from 'viem';

interface Props extends PropsWithChildren<NextPageProps<{ hash: string; chainId: string }>> {}

export default async function SwapPageLayout(props: Props) {
    await setupLocaleForSSR();

    const { hash, chainId } = await props.params;
    const { children } = props;

    const activity = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, Number(chainId)));

    if (!activity) {
        notFound();
    }
    return (
        <>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-bold text-lightMain">
                        <Trans>Transaction</Trans>
                    </span>
                </div>
                <WalletBaseMoreAction address={activity.owner as Address} />
            </div>
            {children}
        </>
    );
}
