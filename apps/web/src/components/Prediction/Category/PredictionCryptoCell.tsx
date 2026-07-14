'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { BUTTON_COLORS } from '@/components/Prediction/PredictionActivityRate.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { ActiveTag } from '@/components/Prediction/PredictionSeries/ActiveTag.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import type {
    PredictionCryptoCellMultiBody,
    PredictionCryptoCellSingleBody,
    PredictionCryptoCellViewModel,
} from '@/helpers/prediction/category/formatPolymarketCryptoCellForUI.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';

interface Props {
    model: PredictionCryptoCellViewModel;
    className?: string;
    onLinkClick?: () => void;
}

/**
 * Figma 85151:45725 price-row + bar shades — distinct from the semantic `success`/`danger` tokens
 * (which BetItem uses), so the periodic crypto cell reads as its own visual family. Buttons reuse
 * {@link BUTTON_COLORS} (the `#dcf1d9` / `#ffe6e4` Figma shades) for dark-mode parity with BetItem.
 */
const PRICE_GREEN_CLASS = 'text-[#48ad3c]';
const PRICE_RED_CLASS = 'text-[#ff564d]';
const BAR_GREEN_CLASS = 'bg-[#48ad3c]';
const BAR_RED_CLASS = 'bg-[#ff564d]';
/** Mirrors BetItem — only render the green gradient when the win-rate clears 5%. */
const MIN_RATIO_FOR_BACKGROUND = 5;

export const PredictionCryptoCell = memo<Props>(function PredictionCryptoCell({ model, className, onLinkClick }) {
    const isMulti = model.body.variant === 'multi';
    const eventHref = RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, model.eventSlug, {
        multiple: isMulti,
    });

    return (
        <Link
            className={classNames(
                'flex flex-col gap-3 rounded-2xl border border-secondaryLine bg-primaryBottom p-4 hover:bg-bg',
                className,
            )}
            href={eventHref}
            onClick={onLinkClick}
        >
            <CryptoCellHeader model={model} />
            {model.body.variant === 'single' ? (
                <SingleMarketBody body={model.body} />
            ) : (
                <MultiMarketBody body={model.body} />
            )}
        </Link>
    );
});

const CryptoCellHeader = memo<{ model: PredictionCryptoCellViewModel }>(function CryptoCellHeader({ model }) {
    return (
        <div className="flex items-center gap-2">
            <PredictionEventImage
                platform={PredictionPlatform.Polymarket}
                src={model.image}
                alt={model.title}
                className="shrink-0"
                width={40}
                height={40}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="line-clamp-1 text-left text-base font-semibold leading-5 text-lightMain">
                    {model.title}
                </h3>
                <LiveSubtitle model={model} />
            </div>
        </div>
    );
});

const LiveSubtitle = memo<{ model: PredictionCryptoCellViewModel }>(function LiveSubtitle({ model }) {
    if (!model.isLive) {
        return <span className="text-[13px] leading-[17px] text-second">{model.coinLabel}</span>;
    }
    return (
        <div className="flex items-center gap-1 text-[13px] leading-[17px]">
            <span className="inline-flex overflow-visible p-px">
                <ActiveTag variant="danger" />
            </span>
            <span className="font-medium text-danger">
                <Trans>Live</Trans>
            </span>
            <span className="text-second">·</span>
            <span className="text-second">{model.coinLabel}</span>
        </div>
    );
});

const SingleMarketBody = memo<{ body: PredictionCryptoCellSingleBody }>(function SingleMarketBody({ body }) {
    const [o0, o1] = body.outcomes;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1">
                    <span
                        className={classNames('max-w-[64px] truncate text-sm font-bold leading-5', PRICE_GREEN_CLASS)}
                    >
                        {o0.label}
                    </span>
                    <span className={classNames('text-sm font-semibold leading-5', PRICE_GREEN_CLASS)}>
                        {o0.priceCents}
                    </span>
                </div>
                <div className="flex flex-1 items-center justify-end gap-1">
                    <span className={classNames('max-w-[64px] truncate text-sm font-bold leading-5', PRICE_RED_CLASS)}>
                        {o1.label}
                    </span>
                    <span className={classNames('text-sm font-semibold leading-5', PRICE_RED_CLASS)}>
                        {o1.priceCents}
                    </span>
                </div>
            </div>

            <div className="flex h-1 overflow-hidden">
                <div className={classNames('h-full', BAR_GREEN_CLASS)} style={{ width: `${o0.percent}%` }} />
                <div className={classNames('h-full', BAR_RED_CLASS)} style={{ width: `${o1.percent}%` }} />
            </div>

            <div className="flex min-w-0 gap-2">
                <CryptoOutcomeButton
                    className={classNames(
                        'flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-bold',
                        BUTTON_COLORS.success.bg,
                        BUTTON_COLORS.success.text,
                    )}
                    slug={body.marketSlug}
                    outcome={0}
                >
                    <span className="block truncate">{o0.label}</span>
                </CryptoOutcomeButton>
                <CryptoOutcomeButton
                    className={classNames(
                        'flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-bold',
                        BUTTON_COLORS.danger.bg,
                        BUTTON_COLORS.danger.text,
                    )}
                    slug={body.marketSlug}
                    outcome={1}
                >
                    <span className="block truncate">{o1.label}</span>
                </CryptoOutcomeButton>
            </div>
        </div>
    );
});

const MultiMarketBody = memo<{ body: PredictionCryptoCellMultiBody }>(function MultiMarketBody({ body }) {
    return (
        <div className="flex flex-col gap-2">
            {body.rows.map((row) => (
                <div key={row.marketSlug} className="flex items-center gap-2">
                    <div
                        className="flex h-5 min-w-0 flex-1 items-center gap-3 rounded-full px-2"
                        style={{
                            background:
                                row.winRatePercent >= MIN_RATIO_FOR_BACKGROUND
                                    ? `linear-gradient(90deg, var(--polymarket-yes-background, #dcf1d9) 0%, var(--polymarket-yes-background-end, rgba(220, 241, 217, 0)) ${row.winRatePercent}%)`
                                    : undefined,
                        }}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-left text-sm leading-5 text-lightMain">{row.thresholdLabel}</p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold leading-5 text-lightMain">{row.winRateLabel}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <CryptoOutcomeButton
                            className={classNames(
                                'flex h-[30px] min-w-0 shrink-0 items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-bold sm:w-[100px] md:w-[120px]',
                                BUTTON_COLORS.success.bg,
                                BUTTON_COLORS.success.text,
                            )}
                            slug={row.marketSlug}
                            outcome={0}
                        >
                            <span className="block truncate">{row.outcomes[0]}</span>
                        </CryptoOutcomeButton>
                        <CryptoOutcomeButton
                            className={classNames(
                                'flex h-[30px] min-w-0 shrink-0 items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-bold sm:w-[100px] md:w-[120px]',
                                BUTTON_COLORS.danger.bg,
                                BUTTON_COLORS.danger.text,
                            )}
                            slug={row.marketSlug}
                            outcome={1}
                        >
                            <span className="block truncate">{row.outcomes[1]}</span>
                        </CryptoOutcomeButton>
                    </div>
                </div>
            ))}
        </div>
    );
});

interface CryptoOutcomeButtonProps {
    className: string;
    slug: string;
    outcome: number;
    children: ReactNode;
}

const CryptoOutcomeButton = memo<CryptoOutcomeButtonProps>(function CryptoOutcomeButton({
    className,
    slug,
    outcome,
    children,
}) {
    const [{ loading }, handleOpenPredictionPage] = useAsyncFn(async () => {
        if (!slug) return;
        await openPredictionPage(slug, { outcome });
    }, [slug, outcome]);

    return (
        <ClickableButton
            className={className}
            data-prevent-progress
            type="button"
            loading={loading}
            onClick={() => {
                if (!slug || loading) return;
                handleOpenPredictionPage();
            }}
        >
            {children}
        </ClickableButton>
    );
});
