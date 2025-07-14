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
        <div className="absolute inset-x-0 top-0 z-1 flex h-[calc(100%_-_40px)] flex-col items-center gap-4 bg-lightBottom dark:bg-darkBottom">
            <LoadingIcon size={54} className="text-highlight" />
            <p className="text-2xl font-semibold text-main">
                <Trans>Sending</Trans>
            </p>
            <p className="text-sm text-second">
                <Trans>
                    The transaction is in progress.
                    <br />
                    You can check its status in history.
                </Trans>
            </p>
        </div>
    );
}

function FailedView() {
    return (
        <div className="absolute inset-x-0 top-0 z-1 flex h-[calc(100%_-_40px)] flex-col items-center gap-4 bg-lightBottom dark:bg-darkBottom">
            <ErrorIcon width={64} height={64} />
            <p className="mt-4 text-2xl font-semibold text-main">
                <Trans>Transaction failed</Trans>
            </p>
        </div>
    );
}

export function TipsMainView() {
    const { recipient, isSending, hash, hasError } = TipsContext.useContainer();

    if (!recipient) return null;

    return (
        <>
            <div className="relative h-[262px] md:h-[272px]">
                <TipsRecipient />
                <TokenAmountInput />
                <TipsTokenInput />
                {recipient ? (
                    recipient.networkType === NetworkType.Ethereum ? (
                        <SendWithEVM />
                    ) : (
                        <SendWithSolana />
                    )
                ) : null}
                {isSending && !hasError && hash ? <LoadingView /> : null}
                {!isSending && hasError ? <FailedView /> : null}
            </div>
        </>
    );
}
