'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, memo, type MouseEvent, type ReactNode, type SVGProps } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { AnimatedText } from '@/components/Prediction/AnimatedText.js';
import { ActiveTag } from '@/components/Prediction/PredictionSeries/ActiveTag.js';
import { Image } from '@/esm/Image.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import {
    parseSportsPriceCentsLabel,
    type PredictionSportsCellViewModel,
    type PredictionSportsDrawOutcomeForUI,
    type PredictionSportsTeamForUI,
} from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';

interface Props {
    model: PredictionSportsCellViewModel;
}

export const PredictionSportsCell = memo<Props>(function PredictionSportsCell({ model }) {
    const eventHref = RouteResolver.betsEventDetail(PredictionPlatform.Polymarket, model.eventSlug, {
        appendRoot: false,
    });

    return (
        <div className="border-line bg-lightBottom dark:bg-darkBottom relative flex flex-col gap-3 rounded-2xl border p-4 transition-colors hover:opacity-95">
            <Link
                href={eventHref}
                className="absolute inset-0 z-0 rounded-2xl"
                aria-label={t`View ${model.homeTeam.name} vs ${model.awayTeam.name}`}
            />
            <div className="pointer-events-none relative z-10 flex flex-col gap-3">
                <SportsCellHeader model={model} />
                {model.layout === 'threeWay' ? (
                    <ThreeWaySportsCellBody model={model} />
                ) : (
                    <>
                        <TeamRow team={model.homeTeam} gamePhase={model.gamePhase} />
                        <TeamRow team={model.awayTeam} gamePhase={model.gamePhase} />
                    </>
                )}
            </div>
        </div>
    );
});

const SportsCellHeader = memo<{ model: PredictionSportsCellViewModel }>(function SportsCellHeader({ model }) {
    switch (model.gamePhase) {
        case 'live':
            return <LiveSportsCellHeader model={model} />;
        case 'finished':
            return <FinishedSportsCellHeader model={model} />;
        default:
            return <ScheduledSportsCellHeader model={model} />;
    }
});

const LiveSportsCellHeader = memo<{ model: PredictionSportsCellViewModel }>(function LiveSportsCellHeader({ model }) {
    return (
        <div className="flex h-7 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap text-[13px] leading-[17px]">
                <div className="flex shrink-0 items-center gap-0.5">
                    <span className="inline-flex overflow-visible p-px">
                        <ActiveTag variant="danger" />
                    </span>
                    <span className="text-danger font-medium">
                        <Trans>LIVE</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    {model.statusLabel ? (
                        <span className="text-main shrink-0 font-semibold">{model.statusLabel}</span>
                    ) : null}
                    <HeaderMeta volumeLabel={model.volumeLabel} leagueLabel={model.leagueLabel} />
                </div>
            </div>
            {model.livestreamUrl ? <LivestreamButton url={model.livestreamUrl} /> : null}
        </div>
    );
});

const ScheduledSportsCellHeader = memo<{ model: PredictionSportsCellViewModel }>(function ScheduledSportsCellHeader({
    model,
}) {
    return (
        <div className="flex h-7 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] leading-[17px]">
            {model.scheduledTimeLabel ? (
                <span className="bg-bg text-main flex h-7 shrink-0 items-center rounded-lg px-2 font-semibold">
                    {model.scheduledTimeLabel}
                </span>
            ) : null}
            <HeaderMeta volumeLabel={model.volumeLabel} leagueLabel={model.leagueLabel} className="font-normal" />
        </div>
    );
});

const FinishedSportsCellHeader = memo<{ model: PredictionSportsCellViewModel }>(function FinishedSportsCellHeader({
    model,
}) {
    return (
        <div className="flex h-7 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] leading-[17px]">
            <span className="text-main shrink-0 font-semibold">
                <Trans>FINAL</Trans>
            </span>
            <HeaderMeta volumeLabel={model.volumeLabel} leagueLabel={model.leagueLabel} className="font-normal" />
        </div>
    );
});

const HeaderMeta = memo<{
    volumeLabel?: string;
    leagueLabel?: string;
    className?: string;
}>(function HeaderMeta({ volumeLabel, leagueLabel, className }) {
    const metaParts = [volumeLabel, leagueLabel].filter(Boolean);
    if (!metaParts.length) return null;

    return <span className={classNames('text-second truncate', className)}>{metaParts.join(' · ')}</span>;
});

const LivestreamButton = memo<{ url: string }>(function LivestreamButton({ url }) {
    const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            type="button"
            className="text-second hover:text-main pointer-events-auto relative z-20 flex size-5 shrink-0 items-center justify-center"
            onClick={handleClick}
            aria-label={t`Open livestream`}
        >
            <LivestreamBroadcastIcon width={20} height={20} />
        </button>
    );
});

const LivestreamBroadcastIcon = memo(function LivestreamBroadcastIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            fill="none"
            viewBox="0 0 20 20"
            aria-hidden
            {...props}
        >
            <path
                fill="currentColor"
                d="M14.7122 2.01866C14.9577 2.2637 14.9602 2.65948 14.7196 2.90757L14.7122 2.91505L13.2838 4.34069H15.9375C17.3182 4.34069 18.4375 5.45999 18.4375 6.84069V15.5907C18.4375 16.9714 17.3182 18.0907 15.9375 18.0907H4.0625C2.6818 18.0907 1.5625 16.9714 1.5625 15.5907V6.84069C1.5625 5.45999 2.6818 4.34069 4.0625 4.34069H6.72029L5.29195 2.91505C5.04395 2.66751 5.04395 2.26618 5.29195 2.01866C5.53994 1.77112 5.94203 1.77112 6.19004 2.01866L8.51648 4.34069H11.4877L13.8141 2.01866C14.0621 1.77112 14.4642 1.77112 14.7122 2.01866ZM15.9375 5.59069H4.0625C3.37904 5.59069 2.82371 6.13921 2.81268 6.82003L2.8125 6.84069V15.5907C2.8125 16.2741 3.36102 16.8295 4.04184 16.8405L4.0625 16.8407H15.9375C16.621 16.8407 17.1763 16.2922 17.1873 15.6114L17.1875 15.5907V6.84069C17.1875 6.15034 16.6279 5.59069 15.9375 5.59069ZM8.57422 7.97351C8.8048 7.97351 9.03193 8.03808 9.23828 8.16882L12.6172 10.2587C13.197 10.6133 13.3791 11.384 13.0078 11.9774C12.9127 12.1407 12.77 12.2823 12.5977 12.3876L9.21875 14.4383C8.6293 14.7909 7.8615 14.6016 7.5 14.0087C7.38656 13.8152 7.32422 13.5914 7.32422 13.3641V9.22351C7.32422 8.53353 7.88336 7.97351 8.57422 7.97351ZM8.59758 9.42167C8.58231 9.44636 8.57422 9.47482 8.57422 9.50386V13.0865C8.57422 13.1142 8.58159 13.1414 8.59558 13.1654C8.60956 13.1893 8.62966 13.2091 8.65382 13.2227C8.67797 13.2363 8.70531 13.2432 8.73302 13.2428C8.76073 13.2423 8.78783 13.2345 8.81152 13.2201L11.7351 11.4457C11.758 11.4318 11.7769 11.4123 11.7901 11.389C11.8032 11.3658 11.8102 11.3395 11.8103 11.3128C11.8104 11.286 11.8037 11.2597 11.7907 11.2363C11.7777 11.2129 11.759 11.1933 11.7362 11.1792L8.81266 9.37097C8.77741 9.34917 8.73495 9.34226 8.69462 9.35176C8.65429 9.36127 8.61938 9.38641 8.59758 9.42165V9.42167Z"
            />
        </svg>
    );
});

const ThreeWaySportsCellBody = memo<{ model: PredictionSportsCellViewModel }>(function ThreeWaySportsCellBody({
    model,
}) {
    const showOutcomeButtons = model.gamePhase !== 'finished' && model.drawOutcome;

    return (
        <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <TeamRow team={model.homeTeam} gamePhase={model.gamePhase} showOutcomeButton={false} />
                <TeamRow team={model.awayTeam} gamePhase={model.gamePhase} showOutcomeButton={false} />
            </div>
            {showOutcomeButtons ? (
                <div className="pointer-events-auto relative z-20 flex shrink-0 flex-col gap-3">
                    <OutcomePriceButton team={model.homeTeam} />
                    <DrawOutcomePriceButton draw={model.drawOutcome!} />
                    <OutcomePriceButton team={model.awayTeam} />
                </div>
            ) : null}
        </div>
    );
});

const TeamRow = memo<{
    team: PredictionSportsTeamForUI;
    gamePhase: PredictionSportsCellViewModel['gamePhase'];
    showOutcomeButton?: boolean;
}>(function TeamRow({ team, gamePhase, showOutcomeButton = true }) {
    const isFinished = gamePhase === 'finished';
    const showLoserStyle = isFinished && team.isLoser;

    return (
        <div className="flex items-center justify-between gap-2">
            <div className={classNames('flex min-w-0 flex-1 items-center gap-2', showLoserStyle ? 'opacity-40' : '')}>
                {typeof team.score === 'number' ? (
                    <span
                        className={classNames(
                            'flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                            team.isWinner ? 'bg-main text-white' : 'bg-bg text-main',
                        )}
                    >
                        {team.score}
                    </span>
                ) : null}
                {team.logo ? (
                    <Image
                        src={team.logo}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <span className="bg-bg size-9 shrink-0 rounded-lg" aria-hidden />
                )}
                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-main truncate text-sm font-semibold leading-[18px]">{team.name}</span>
                    {team.record ? (
                        <span className="text-second shrink-0 text-sm font-medium leading-[18px]">{team.record}</span>
                    ) : null}
                </div>
            </div>
            {showOutcomeButton && gamePhase !== 'finished' ? <OutcomePriceButton team={team} /> : null}
        </div>
    );
});

function stopCardNavigation(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
}

const AnimatedPriceCents = memo<{ priceCents: string; className?: string }>(function AnimatedPriceCents({
    priceCents,
    className,
}) {
    const { amount, unit } = parseSportsPriceCentsLabel(priceCents);

    return (
        <span className={classNames('inline-flex items-center leading-6', className)}>
            <AnimatedText className="shrink-0" text={amount} />
            {unit ? <span className="shrink-0">{unit}</span> : null}
        </span>
    );
});

interface SportsOutcomePriceButtonProps {
    marketSlug?: string;
    outcomeIndex?: number;
    className: string;
    style?: CSSProperties;
    children: ReactNode;
}

const SportsOutcomePriceButton = memo<SportsOutcomePriceButtonProps>(function SportsOutcomePriceButton({
    marketSlug,
    outcomeIndex = 0,
    className,
    style,
    children,
}) {
    const [{ loading }, handleOpen] = useAsyncFn(async () => {
        if (!marketSlug) return;
        await openPredictionPage(marketSlug, { outcome: outcomeIndex });
    }, [marketSlug, outcomeIndex]);

    return (
        <ClickableButton
            type="button"
            className={classNames('pointer-events-auto relative z-20', className)}
            style={style}
            data-prevent-progress
            loading={loading}
            onClick={(event) => {
                stopCardNavigation(event);
                if (!marketSlug || loading) return;
                void handleOpen();
            }}
        >
            {children}
        </ClickableButton>
    );
});

const DrawOutcomePriceButton = memo<{ draw: PredictionSportsDrawOutcomeForUI }>(function DrawOutcomePriceButton({
    draw,
}) {
    return (
        <SportsOutcomePriceButton
            marketSlug={draw.marketSlug}
            outcomeIndex={draw.outcomeIndex}
            className="bg-bg text-main flex h-9 w-32 shrink-0 items-center justify-center gap-1 rounded-lg px-4 text-sm"
        >
            <span className="font-medium opacity-80">
                <Trans>DRAW</Trans>
            </span>
            <AnimatedPriceCents className="font-bold" priceCents={draw.priceCents} />
        </SportsOutcomePriceButton>
    );
});

const OutcomePriceButton = memo<{ team: PredictionSportsTeamForUI }>(function OutcomePriceButton({ team }) {
    const abbreviation = team.abbreviation?.toUpperCase();

    return (
        <SportsOutcomePriceButton
            marketSlug={team.marketSlug}
            outcomeIndex={team.outcomeIndex}
            className={classNames(
                'flex h-9 w-32 shrink-0 items-center justify-center gap-1 rounded-lg px-4 text-sm text-white',
                team.color ? '' : 'bg-highlight',
            )}
            style={team.color ? { backgroundColor: team.color } : undefined}
        >
            {abbreviation ? <span className="font-medium opacity-80">{abbreviation}</span> : null}
            <AnimatedPriceCents className="font-bold" priceCents={team.priceCents} />
        </SportsOutcomePriceButton>
    );
});
