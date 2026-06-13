'use client';

import type { Locale } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type CSSProperties, memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { formatFifaAdvancePercent } from '@/helpers/prediction/category/fifaGroups.js';
import { getFifaGroupScores } from '@/providers/firefly/prediction/getFifaGroupScores.js';
import type { FifaGroupScoreGroup, FifaGroupScoreTeam } from '@/providers/types/Firefly.js';

const DESKTOP_STAT_COLUMNS = [
    { key: 'played', label: <Trans>Played</Trans> },
    { key: 'wins', label: <Trans>Wins</Trans> },
    { key: 'draws', label: <Trans>Draws</Trans> },
    { key: 'losses', label: <Trans>Losses</Trans> },
    { key: 'points', label: <Trans>Points</Trans> },
] as const;

const MOBILE_STAT_COLUMNS = [
    { key: 'points', label: <Trans>Pts</Trans> },
    { key: 'wins', label: <Trans>W</Trans> },
    { key: 'draws', label: <Trans>D</Trans> },
    { key: 'losses', label: <Trans>L</Trans> },
    { key: 'played', label: <Trans>P</Trans> },
] as const;

const MOBILE_GROUP_GRID_CLASS = 'grid grid-cols-[minmax(80px,1fr)_32px_32px_32px_32px_32px_56px] items-center gap-0';

const DESKTOP_GROUP_GRID_CLASS = 'grid grid-cols-[minmax(150px,1fr)_56px_56px_56px_56px_56px_66px] items-center gap-0';

function getTeamFallbackLabel(team: FifaGroupScoreTeam) {
    return team.country_code?.trim() || team.country_key?.trim() || team.country.trim().slice(0, 2).toUpperCase();
}

function TeamFlag({ team }: { team: FifaGroupScoreTeam }) {
    const flag = team.flag_image?.trim();
    if (flag) {
        return <img src={flag} alt="" className="h-5 w-[30px] shrink-0 rounded object-cover" />;
    }

    return (
        <span className="flex h-5 w-[30px] shrink-0 items-center justify-center rounded bg-bg text-[9px] font-bold text-second">
            {getTeamFallbackLabel(team)}
        </span>
    );
}

function getAdvancingStyle(team: FifaGroupScoreTeam): CSSProperties | undefined {
    const color = team.team_color?.trim();
    if (!color) return undefined;
    return { backgroundColor: color };
}

const AdvanceProbabilityButton = memo<{
    team: FifaGroupScoreTeam;
    className: string;
}>(function AdvanceProbabilityButton({ team, className }) {
    const marketSlug = team.advance_market_slug?.trim();

    return (
        <ClickableButton
            type="button"
            className={classNames(
                'flex items-center justify-center text-white',
                team.team_color?.trim() ? '' : 'bg-highlight',
                className,
            )}
            style={getAdvancingStyle(team)}
            data-prevent-progress
            disabled={!marketSlug}
            onClick={() => {
                if (!marketSlug) return;
                void openPredictionPage(marketSlug, { outcome: 0 });
            }}
        >
            {formatFifaAdvancePercent(team)}
        </ClickableButton>
    );
});

function MobileGroupTeamRow({ team }: { team: FifaGroupScoreTeam }) {
    return (
        <div className={classNames(MOBILE_GROUP_GRID_CLASS, 'text-xs font-medium leading-[14px]')}>
            <div className="flex min-w-0 items-center gap-1 pr-1">
                <TeamFlag team={team} />
                <span className="min-w-0 whitespace-normal break-words text-main">{team.country}</span>
            </div>
            {MOBILE_STAT_COLUMNS.map(({ key }) => (
                <span key={key} className="text-center text-second">
                    {team[key]}
                </span>
            ))}
            <AdvanceProbabilityButton
                team={team}
                className="h-8 w-14 rounded-lg px-1 text-center text-[13px] font-medium leading-[17px]"
            />
        </div>
    );
}

function DesktopGroupTeamRow({ team }: { team: FifaGroupScoreTeam }) {
    return (
        <div className={classNames(DESKTOP_GROUP_GRID_CLASS, 'text-xs font-medium leading-[14px]')}>
            <div className="flex min-w-0 items-center gap-1 pr-3">
                <TeamFlag team={team} />
                <span className="min-w-0 whitespace-normal break-words text-main">{team.country}</span>
            </div>
            {DESKTOP_STAT_COLUMNS.map(({ key }) => (
                <span key={key} className="text-center text-second">
                    {team[key]}
                </span>
            ))}
            <AdvanceProbabilityButton
                team={team}
                className="h-8 w-[66px] rounded-lg px-2 text-center text-[13px] font-medium leading-[17px]"
            />
        </div>
    );
}

function MobileGroupCard({ group }: { group: FifaGroupScoreGroup }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-secondaryLine bg-lightBottom p-3 dark:bg-darkBottom md:hidden">
            <div className="flex w-full flex-col gap-3">
                <div className={classNames(MOBILE_GROUP_GRID_CLASS, 'text-xs font-medium leading-[14px] text-second')}>
                    <h2 className="text-[13px] font-semibold leading-[17px] text-main">
                        <Trans>Group {group.group_letter}</Trans>
                    </h2>
                    {MOBILE_STAT_COLUMNS.map(({ key, label }) => (
                        <span key={key} className="text-center">
                            {label}
                        </span>
                    ))}
                    <span className="text-center">
                        <Trans>Adv</Trans>
                    </span>
                </div>
                {group.teams.map((team) => (
                    <MobileGroupTeamRow key={`${group.group_letter}-${team.country_key || team.country}`} team={team} />
                ))}
            </div>
        </section>
    );
}

function DesktopGroupCard({ group }: { group: FifaGroupScoreGroup }) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-secondaryLine bg-lightBottom p-4 dark:bg-darkBottom md:block">
            <div className="flex w-full flex-col gap-3">
                <div className={classNames(DESKTOP_GROUP_GRID_CLASS, 'text-xs font-medium leading-[14px] text-second')}>
                    <h2 className="text-[13px] font-semibold leading-[17px] text-main">
                        <Trans>Group {group.group_letter}</Trans>
                    </h2>
                    {DESKTOP_STAT_COLUMNS.map(({ key, label }) => (
                        <span key={key} className="text-center">
                            {label}
                        </span>
                    ))}
                    <span className="text-center">
                        <Trans>Advancing</Trans>
                    </span>
                </div>
                {group.teams.map((team) => (
                    <DesktopGroupTeamRow
                        key={`${group.group_letter}-${team.country_key || team.country}`}
                        team={team}
                    />
                ))}
            </div>
        </section>
    );
}

export const PredictionCategoryGroupsList = memo(function PredictionCategoryGroupsList() {
    const {
        i18n: { locale },
    } = useLingui();
    const { data, isPending, isError } = useQuery({
        queryKey: ['prediction', 'category', 'fifa-groups-score'],
        queryFn: () => getFifaGroupScores(locale as Locale),
    });

    if (isPending) {
        return (
            <div className="flex justify-center py-12">
                <Loading />
            </div>
        );
    }

    if (isError) {
        return (
            <p className="px-4 py-12 text-center text-sm text-second">
                <Trans>Failed to load groups</Trans>
            </p>
        );
    }

    const groups = data?.groups ?? [];
    if (!groups.length) {
        return <NoResultsFallback message={<Trans>No predictions found</Trans>} />;
    }

    return (
        <div className="flex flex-col gap-3 px-4 pb-8 pt-0">
            {groups.map((group) => (
                <div key={group.group_letter}>
                    <MobileGroupCard group={group} />
                    <DesktopGroupCard group={group} />
                </div>
            ))}
        </div>
    );
});
