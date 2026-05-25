'use client';

import type { NonFungibleTokenTrait } from '@dimensiondev/web3/types';
import { Trans } from '@lingui/react/macro';

import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { getNFTPropertyValue } from '@/helpers/getNFTPropertyValue.js';
import type { EVM } from '@/providers/nftscan/types.js';

interface NFTPropertiesProps {
    items: NonFungibleTokenTrait[] | EVM.Attribute[];
}

export function NFTProperties(props: NFTPropertiesProps) {
    return (
        <div className="w-full space-y-2">
            <h3 className="text-xl font-bold leading-6">
                <Trans>Properties</Trans>
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {props.items.map((x) => {
                    const type = 'type' in x ? x.type : x.attribute_name;
                    const value = 'type' in x ? getNFTPropertyValue(x.displayType, x.value) : x.attribute_value;

                    return (
                        <div
                            key={type}
                            className="flex flex-col items-center justify-center space-y-2.5 rounded-[10px] border border-line bg-lightBg p-2.5 text-center"
                        >
                            <TextOverflowTooltip content={type}>
                                <div className="w-full truncate text-base font-normal leading-[22px] text-second">
                                    {type}
                                </div>
                            </TextOverflowTooltip>
                            <TextOverflowTooltip content={value}>
                                <div className="w-full truncate text-base font-bold leading-6 text-lightMain">
                                    {value}
                                </div>
                            </TextOverflowTooltip>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
