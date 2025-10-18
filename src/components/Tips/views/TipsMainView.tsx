import { Trans } from '@lingui/react/macro';

import ErrorIcon from '@/assets/error-circle.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SendWithEVM, SendWithSolana } from '@/components/Tips/SendTipsButton.js';
import { TipsRecipient } from '@/components/Tips/TipsRecipient.js';
import { TipsTokenInput } from '@/components/Tips/TipsTokenInput.js';
import { TokenAmountInput } from '@/components/Tips/TokenAmountInput.js';
import { NetworkType } from '@/constants/enum.js';
import { TipsContext } from '@/hooks/useTipsContext.js';

function LoadingView() {
    return (
        <div className="flex flex-col items-center gap-4 bg-lightBottom dark:bg-darkBottom">
            <LoadingIcon size={54} className="text-highlight" />
            <p className="text-2xl font-semibold text-main">
                <Trans>Sending</Trans>
            </p>
            <p className="text-sm text-second">
                <Trans>The transaction is in progress.</Trans>
            </p>
        </div>
    );
}

function FailedView() {
    return (
        <div className="flex flex-col items-center gap-4 bg-lightBottom dark:bg-darkBottom">
            <ErrorIcon width={64} height={64} />
            <p className="text-2xl font-semibold text-main">
                <Trans>Transaction failed</Trans>
            </p>
        </div>
    );
}

export function TipsMainView() {
    const { recipient, showLoadingView, showFailedView } = TipsContext.useContainer();

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
                {button}
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
