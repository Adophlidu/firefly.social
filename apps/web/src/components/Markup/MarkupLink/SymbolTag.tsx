'use client';

import { memo, useMemo, useState } from 'react';

import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { Link } from '@/components/Link.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { useTippyContext } from '@/components/TippyContext/index.js';
import { TokenProfileCard } from '@/components/Token/TokenProfileCard.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useTokenCoin } from '@/hooks/useTokenCoin.js';

export const SymbolTag = memo<Omit<MarkupLinkProps, 'post'>>(function SymbolTag({ title }) {
    const symbol = title?.startsWith('$') ? title.slice(1) : title;
    const [coin] = useTokenCoin(symbol);
    const [show, setShow] = useState(false);
    const isMedium = useIsMedium();
    const insideTippy = useTippyContext();

    const tokenPageUrl = useMemo(() => {
        if (coin?.id) return resolveTokenPageUrl({ identity: coin.id, isCoinId: true });
        if (coin)
            return resolveTokenPageUrl({
                identity: symbol || coin.contract_address,
                chainId: coin.chain ? resolveCoinGeckoChainId(coin.chain) : undefined,
                address: coin.contract_address,
            });
        return resolveTokenPageUrl({ identity: symbol || '' });
    }, [coin, symbol]);

    if (!symbol) return null;
    // $123 or $100M
    if (symbol.match(/^\d+$/) || /^\d+(k|m|b|t)$/i.test(symbol)) return title;
    const enabled = isMedium && show;

    const content = (
        <Link
            className="text-highlight cursor-pointer hover:underline"
            onClick={(e) => {
                e.stopPropagation();
            }}
            prefetch={false}
            href={tokenPageUrl}
        >
            {title}
        </Link>
    );

    if (isMedium && !insideTippy) {
        return (
            <InteractiveTippy
                className="tippy-card symbol-tag-tippy !max-w-[415px]"
                placement="bottom"
                onShow={() => setShow(true)}
                onHidden={() => setShow(false)}
                delay={100}
                offset={[0, 0]}
                content={
                    enabled ? (
                        <TokenProfileCard
                            className="bg-primaryBottom text-main w-[415px] p-2 shadow-[0_8px_20px_0_rgba(0,0,0,0.04)]"
                            symbol={symbol}
                        />
                    ) : null
                }
            >
                {content}
            </InteractiveTippy>
        );
    }
    return content;
});
