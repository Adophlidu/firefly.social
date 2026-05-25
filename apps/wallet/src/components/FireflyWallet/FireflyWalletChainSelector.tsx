import { cloneElement, type HTMLProps, type ReactElement, type ReactNode, useMemo } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select.js';

export interface FireflyWalletChainSelectorProps<C extends string = string> {
    chains: Array<{
        value: C;
        label: ReactNode;
        icon: ReactElement<HTMLProps<'svg'>>;
    }>;
    selectedChain: C;
    onSelectChain: (value: C) => void;
    noLabel?: boolean;
}

export function FireflyWalletChainSelector<C extends string = string>({
    chains,
    selectedChain,
    onSelectChain,
    noLabel = false,
}: FireflyWalletChainSelectorProps<C>) {
    const chain = useMemo(() => chains.find(({ value }) => value === selectedChain), [selectedChain, chains]);

    return (
        <Select value={selectedChain as string} onValueChange={(v) => onSelectChain(v as C)}>
            <SelectTrigger className="inline-flex h-8 w-auto items-center rounded-full bg-bg px-2 text-[13px] font-medium">
                {chain?.icon
                    ? cloneElement(chain.icon, {
                          width: 15,
                          height: 15,
                          className: 'shrink-0 mr-2',
                      })
                    : null}
                {chain?.label && !noLabel ? <span className="mr-1">{chain.label}</span> : null}
            </SelectTrigger>
            <SelectContent
                position="popper"
                side="bottom"
                align="end"
                className="z-50 w-[130px] origin-top-left !overflow-visible bg-primaryBottom text-xs outline-none transition data-[state=closed]:scale-95 data-[state=closed]:opacity-0"
                viewPortClassName="py-3"
            >
                {chains.map(({ value, label, icon }) => (
                    <SelectItem key={value as string} value={value as string} className="hover:bg-bg">
                        <div className="flex items-center">
                            {icon
                                ? cloneElement(icon, {
                                      width: 15,
                                      height: 15,
                                      className: 'shrink-0 mr-1',
                                  })
                                : null}
                            <div>{label}</div>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
