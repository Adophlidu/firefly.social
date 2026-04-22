'use client';

import DotsIcon from '@dimensiondev/assets/dots.svg';
import QuestionIcon from '@dimensiondev/assets/question.svg';
import { classNames } from '@dimensiondev/utils';
import { getChainInfo } from '@dimensiondev/web3/chains';
import { formatAddress } from '@dimensiondev/web3/utils';
import { MenuItem, MenuItems, type MenuItemsProps } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, type HTMLProps, memo, type PropsWithChildren } from 'react';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import type { Contract } from '@/providers/types/Trending.js';

interface Props extends PropsWithChildren {
    contracts: Contract[];
    onSelect?: (contract: Contract) => void;
    menuAnchor?: MenuItemsProps['anchor'];
}

export const ContractList = memo<Props>(function ContractList({
    contracts,
    onSelect,
    menuAnchor = 'top end',
    children,
}) {
    return (
        <MoreActionMenu
            loginRequired={false}
            button={
                children ?? (
                    <Tooltip content={<Trans>More</Trans>} placement="top">
                        <DotsIcon className="text-secondary" width={16} height={16} />
                    </Tooltip>
                )
            }
            buttonProps={{ as: 'div', className: 'active:!scale-100' }}
        >
            <MenuItems
                style={{ '--anchor-max-height': '225px' } as CSSProperties}
                className="border-line bg-primaryBottom text-main z-[1000] flex max-h-[225px] w-max flex-col overflow-auto rounded-2xl border py-3 text-base shadow-[0_0_20px_0_rgba(34,49,71,0.05)] backdrop-blur"
                data-hide-scrollbar
                onClick={stopEvent}
                anchor={menuAnchor}
            >
                {contracts.map((contract) => (
                    <MenuItem key={contract.address}>
                        {({ close }) => (
                            <ContractItem
                                className="border-line hover:bg-bg02 cursor-pointer rounded border-b px-3 last-of-type:border-0"
                                contract={contract}
                                onClick={() => {
                                    onSelect?.(contract);
                                    close();
                                }}
                            />
                        )}
                    </MenuItem>
                ))}
            </MenuItems>
        </MoreActionMenu>
    );
});

interface ContractItemProps extends HTMLProps<HTMLDivElement> {
    contract: Contract;
}

function ContractItem({ contract, ...rest }: ContractItemProps) {
    const chain = getChainInfo(contract.runtime, contract.chainId);
    const name = chain?.name || contract.runtime;

    return (
        <div {...rest} className={classNames('flex items-center gap-2', rest.className)}>
            {chain?.icon ? (
                <Image src={chain.icon} className="shrink-0" alt={name} width={16} height={16} />
            ) : (
                <QuestionIcon className="text-second ml-1 cursor-pointer" width={16} height={16} />
            )}
            <div className="min-w-[100px] grow p-1 leading-4">
                <div className="text-main text-[12px] font-bold capitalize">{name}</div>
                <div className="text-main max-w-[160px] truncate text-[12px] font-bold" data-address={contract.address}>
                    {formatAddress(contract.address, 4)}
                </div>
            </div>
            <CopyTextButton
                notification="toast"
                text={contract.address}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            />
        </div>
    );
}
