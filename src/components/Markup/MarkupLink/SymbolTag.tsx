'use client';

import { memo, useState } from 'react';

import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { Link } from '@/components/Link.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { useTippyContext } from '@/components/TippyContext/index.js';
import { TokenProfile } from '@/components/Token/TokenProfile.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useTokenCoin } from '@/hooks/useTokenCoin.js';

export const SymbolTag = memo<Omit<MarkupLinkProps, 'post'>>(function SymbolTag({ title }) {
    const [coin] = useTokenCoin(title?.slice(1));
    const [show, setShow] = useState(false);
    const isMedium = useIsMedium();
    const insideTippy = useTippyContext();

    if (!title) return null;
    const symbol = title.slice(1);
    // $123 or $100M
    if (symbol.match(/^\d+$/) || /^\d+(k|m|b|t)$/i.test(symbol)) return title;
    const enabled = isMedium && show;

    const content = (
        <Link
            className="cursor-pointer text-highlight hover:underline"
            onClick={(e) => {
                e.stopPropagation();
            }}
            prefetch={false}
            href={resolveTokenPageUrl(
                coin?.id
                    ? { identity: coin.id, isCoinId: true }
                    : { identity: symbol, address: coin?.contract_address },
            )}
        >
            {title}
        </Link>
    );

    if (isMedium && !insideTippy) {
        return (
            <InteractiveTippy
                className="tippy-card symbol-tag-tippy"
                placement="bottom"
                onShow={() => setShow(true)}
                onHidden={() => setShow(false)}
                delay={100}
                content={
                    enabled ? (
                        <TokenProfile
                            className="w-[415px] bg-primaryBottom p-2 text-main shadow-[0_8px_20px_0_rgba(0,0,0,0.04)]"
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
