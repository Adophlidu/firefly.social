import { Dialog } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch, useRouterState } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import AddIcon from '@/assets/add-circle.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { BackButton, CloseButton } from '@/components/IconButton.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType } from '@/constants/enum.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import { TipsContext } from '@/hooks/useTipsContext.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface TipsModalHeaderProps {
    title?: ReactNode;
    back?: boolean;
}

export function TipsModalHeader({ title, back = false }: TipsModalHeaderProps) {
    const isSmall = useIsSmall('max');
    const { location } = useRouterState();
    const { context } = useMatch({ from: rootRouteId });
    const { recipient, token } = TipsContext.useContainer();

    const networkType = recipient?.networkType;
    const defaultChainId = networkType === NetworkType.Solana ? SolanaChainId.Mainnet : EthereumChainId.Mainnet;

    return (
        <Dialog.Title
            as="h3"
            className="relative mb-4 flex h-10 shrink-0 items-center justify-center text-center pt-safe"
        >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-fourMain">
                {back ? (
                    <BackButton onClick={() => router.navigate({ to: TipsRoutePath.TIPS, replace: true })} />
                ) : !isSmall ? (
                    <CloseButton onClick={context.onClose} />
                ) : null}
            </span>
            <span className="max-w-full truncate text-lg font-bold leading-[22px] sm:max-w-[calc(100%-70px)]">
                {title || <Trans>Tips</Trans>}
            </span>
            {location.pathname === TipsRoutePath.SELECT_TOKEN &&
            networkType &&
            [NetworkType.Ethereum].includes(networkType) ? (
                <ClickableButton
                    className="text-md absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2 text-main"
                    onClick={() => {
                        AddCustomERC20ModalRef.open({
                            initialChainId: token?.chainId || defaultChainId,
                        });
                    }}
                >
                    <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
                </ClickableButton>
            ) : null}
        </Dialog.Title>
    );
}
