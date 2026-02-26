import { classNames } from '@dimensiondev/utils';
import { MenuItem, MenuItems, type MenuItemsProps } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, type HTMLProps, memo, type PropsWithChildren } from 'react';

import DotsIcon from '@/assets/dots.svg';
import QuestionIcon from '@/assets/question.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getChainInfo } from '@/helpers/getChainInfo.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { type Contract } from '@/providers/types/Trending.js';

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
            buttonClassName="active:!scale-100"
            button={
                children ?? (
                    <Tooltip content={<Trans>More</Trans>} placement="top">
                        <DotsIcon className="text-secondary" width={16} height={16} />
                    </Tooltip>
                )
            }
        >
            <MenuItems
                style={{ '--anchor-max-height': '225px' } as CSSProperties}
                className="z-[1000] flex max-h-[225px] w-max flex-col overflow-auto rounded-2xl border border-line bg-primaryBottom py-3 text-base text-main shadow-[0_0_20px_0_rgba(34,49,71,0.05)] backdrop-blur"
                data-hide-scrollbar
                onClick={stopEvent}
                anchor={menuAnchor}
            >
                {contracts.map((contract) => (
                    <MenuItem key={contract.address}>
                        {({ close }) => (
                            <ContractItem
                                className="cursor-pointer rounded border-b border-line px-3 last-of-type:border-0 hover:bg-bg02"
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
                <QuestionIcon className="ml-1 cursor-pointer text-second" width={16} height={16} />
            )}
            <div className="min-w-[100px] grow p-1 leading-4">
                <div className="text-[12px] font-bold capitalize text-main">{name}</div>
                <div className="max-w-[160px] truncate text-[12px] font-bold text-main" data-address={contract.address}>
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
