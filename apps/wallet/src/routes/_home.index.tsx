import AddIcon from '@dimensiondev/assets/add-small.svg';
import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { createFileRoute } from '@tanstack/react-router';
import { type ReactNode, useMemo, useState } from 'react';
import urlcat from 'urlcat';

import { AddCustomERC20Modal } from '@/components/AddCustomERC20Modal.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { TokenItem } from '@/components/TokenItem.js';
import { Button } from '@/components/ui/button.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { useExpandableTokens } from '@/hooks/useExpandableTokens.js';
import { useMultiChainTokens } from '@/hooks/useMultiChainTokens.js';
import { cn } from '@/lib/utils.js';

export const Route = createFileRoute('/_home/')({
    component: HomePage,
});

export function HomePage() {
    const { data: rawData, isLoading } = useMultiChainTokens();
    const data = useMemo(
        () => rawData?.tokenAssets?.map((token) => formatTokenFromFireflyTokenAsset(token)) ?? [],
        [rawData],
    );
    const { tokens, canExpand, showSmall, setShowSmall } = useExpandableTokens(data);

    return (
        <div className="relative w-full">
            <div className="-mt-11 ml-auto flex h-11 w-9 -translate-x-4 flex-row items-center justify-end">
                <AddButton />
            </div>
            {isLoading ? (
                <LoadingPanel />
            ) : !tokens.length ? (
                <div className="px-3 py-2">
                    <NoResultsFallback className="mt-20" />
                </div>
            ) : (
                <div className="w-full pt-3">
                    {tokens.map((token) => (
                        <TokenItem
                            token={token}
                            key={`${token.chainId}-${token.id}`}
                            className="rounded-none px-4 duration-100 hover:bg-bg"
                            onClick={() => {
                                iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                                    path: urlcat(`/token/${token.symbol}`, {
                                        chainId: token.chainId,
                                    }),
                                });
                            }}
                        />
                    ))}
                    {canExpand ? (
                        <ClickableButton
                            className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold text-highlight hover:bg-lightBg"
                            onClick={() => setShowSmall((prev) => !prev)}
                        >
                            <span>
                                {showSmall ? (
                                    <Trans>Hide assets &lt; 1 USD</Trans>
                                ) : (
                                    <Trans>Show assets &lt; 1 USD</Trans>
                                )}
                            </span>
                            <LineArrowUp width={20} height={20} className={showSmall ? '' : 'rotate-180'} />
                        </ClickableButton>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function AddButton({ icon, className }: { icon?: ReactNode; className?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <AddCustomERC20Modal open={open} onClose={() => setOpen(false)} />
            <Button
                variant="ghost"
                size="icon"
                className={cn('[&_svg]:size-5', className)}
                onClick={() => setOpen(true)}
            >
                {icon ? icon : <AddIcon width={20} height={20} />}
            </Button>
        </>
    );
}
