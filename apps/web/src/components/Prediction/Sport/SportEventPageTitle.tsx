'use client';

import { memo } from 'react';

import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';

interface SportEventPageTitleProps {
    homeName?: string;
    homeAbbreviation?: string;
    awayName?: string;
    awayAbbreviation?: string;
}

/**
 * Renders the "{home} vs. {away}" header title for a sports event, localizing the
 * team (country) names via the client-side country list. Must be a client component
 * because the translation source (game countries store) is only populated in the browser.
 */
export const SportEventPageTitle = memo<SportEventPageTitleProps>(function SportEventPageTitle({
    homeName,
    homeAbbreviation,
    awayName,
    awayAbbreviation,
}) {
    const resolveTeamName = useLocalizedSportsTeamName();
    const home = (homeName ? resolveTeamName(homeName) : '') || homeAbbreviation || 'Home';
    const away = (awayName ? resolveTeamName(awayName) : '') || awayAbbreviation || 'Away';

    return <>{`${home} vs. ${away}`}</>;
});
