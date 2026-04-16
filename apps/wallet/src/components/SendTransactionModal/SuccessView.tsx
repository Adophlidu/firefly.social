import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import ComebackIcon from '@dimensiondev/assets/comeback2.svg';
import SuccessIcon from '@dimensiondev/assets/success.svg';
import { Trans } from '@lingui/react/macro';
import { Navigate, useLocation, useNavigate } from '@tanstack/react-router';
import { omit } from 'lodash-es';
import { useRef } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { multipliedBy } from '@/helpers/number.js';

export function SuccessView() {
    const navigate = useNavigate();
    const { token: contextToken } = useSendToken();
    const location = useLocation();
    const state = location.state as unknown as FormValues & { hash: string };
    const stateRef = useRef(state);

    if (!contextToken || !stateRef.current?.token) {
        return <Navigate to={RoutePath.SelectToken} />;
    }

    const { token, recipient, amount, to, hash } = stateRef.current;
    return (
        <div className="flex w-full flex-1 flex-col px-6 pb-6">
            <div className="relative flex items-center justify-center py-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 [&_svg]:size-6"
                    onClick={() => navigate({ to: '/' })}
                >
                    <ComebackIcon />
                </Button>
                <h2 className="text-main text-lg font-semibold">
                    <Trans>Transaction completed!</Trans>
                </h2>
            </div>
            <div className="my-auto flex size-full flex-col justify-between">
                <div className="flex flex-col items-center space-y-4 pb-6">
                    <SuccessIcon width={64} height={64} className="shrink-0" />
                    <p className="text-main text-2xl font-semibold">
                        <Trans>Transaction completed!</Trans>
                    </p>
                </div>
                <div className="relative w-full">
                    <div className="bg-bg mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-6">
                        <div className="flex items-center gap-x-4">
                            <TokenIcon
                                icon={token.logoUrl}
                                networkType={token.networkType}
                                chainId={token.chainId}
                                size={36}
                                symbol={token.symbol}
                                name={token.name}
                            />
                            <div className="flex flex-col space-y-1 text-left">
                                <span className="h-[18px] text-lg font-semibold leading-[18px]">{token.symbol}</span>
                                <span className="text-second h-3.5 text-sm leading-[14px]">
                                    <Trans>Send</Trans>
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end justify-center space-y-1">
                            <div className="h-[18px] text-lg font-semibold leading-[18px]">{formatPrice(amount)}</div>
                            <div className="text-second text-sm">${multipliedBy(token.price, amount).toFormat()}</div>
                        </div>
                    </div>
                    <div className="border-primaryBottom bg-bg absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 dark:bg-[#222]">
                        <ArrowDownIcon className="text-main" width={24} height={24} />
                    </div>
                    <div className="bg-bg w-full rounded-2xl px-4 py-6">
                        <RecipientItem
                            {...(recipient
                                ? (omit(recipient, 'handle', 'tag') as RecipientItemProps)
                                : { address: to })}
                        />
                    </div>
                </div>

                <div className="mt-6 flex w-full space-x-2">
                    <ActionButton
                        variant="secondary"
                        className="bg-secondaryLine text-medium h-10 w-full rounded-lg border-none"
                        onClick={() => {
                            const href = getBlockExplorersURL(token.chainId, hash, 'tx');
                            window.open(href, '_blank');
                        }}
                    >
                        <Trans>See details</Trans>
                    </ActionButton>
                    <ActionButton
                        className="h-10 w-full rounded-lg"
                        onClick={() => {
                            navigate({ to: '/' });
                        }}
                    >
                        <span className="text-medium">
                            <Trans>Done</Trans>
                        </span>
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
