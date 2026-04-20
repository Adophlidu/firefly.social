'use client';

import ErrorIcon from '@dimensiondev/assets/error-circle.svg';
import { NetworkType } from '@dimensiondev/web3/enums';
import { Trans } from '@lingui/react/macro';

import { ActionButton } from '@/components/ActionButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SendWithEVM, SendWithSolana } from '@/components/Tips/SendTipsButton.js';
import { TipsRecipient } from '@/components/Tips/TipsRecipient.js';
import { TipsTokenInput } from '@/components/Tips/TipsTokenInput.js';
import { TokenAmountInput } from '@/components/Tips/TokenAmountInput.js';
import { useTipsStore } from '@/store/useTipsStore.js';

function LoadingView() {
    return (
        <div className="bg-lightBottom dark:bg-darkBottom flex flex-col items-center gap-4">
            <LoadingIcon size={54} className="text-highlight" />
            <p className="text-main text-2xl font-semibold">
                <Trans>Sending</Trans>
            </p>
            <p className="text-second text-sm">
                <Trans>The transaction is in progress.</Trans>
            </p>
        </div>
    );
}

function FailedView() {
    const { error, reset } = useTipsStore();
    return (
        <>
            <div className="bg-lightBottom dark:bg-darkBottom flex flex-col items-center gap-4">
                <ErrorIcon width={64} height={64} />
                <p className="text-main text-2xl font-semibold">
                    <Trans>Transaction failed</Trans>
                </p>
                <div className="text-second mt-4 line-clamp-2 w-full break-all text-sm">{error?.message}</div>
            </div>
            <div className="flex w-full items-center gap-2">
                <ActionButton
                    className="text-medium mt-12 h-10 w-full rounded-lg"
                    onClick={() => {
                        reset();
                    }}
                >
                    <Trans>Try again</Trans>
                </ActionButton>
            </div>
        </>
    );
}

export function TipsMainView() {
    const { recipient, showLoadingView, showFailedView } = useTipsStore();

    if (!recipient) return null;

    const button = recipient ? (
        recipient.networkType === NetworkType.Ethereum ? (
            <SendWithEVM />
        ) : (
            <SendWithSolana />
        )
    ) : null;

    if (showLoadingView) {
        return (
            <div className="flex size-full flex-col justify-between pt-6">
                <LoadingView />
                {button}
            </div>
        );
    }

    if (showFailedView) {
        return (
            <div className="flex size-full flex-col justify-between pt-6">
                <FailedView />
            </div>
        );
    }

    return (
        <>
            <div className="relative h-full">
                <TipsRecipient />
                <TokenAmountInput />
                <TipsTokenInput />
                {button}
            </div>
        </>
    );
}
