import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_GROUPS_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import { groupSportsEventsForDisplay } from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import type { PolymarketEventListData, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

export function categoryHasGamesDisplayContent(response: PolymarketSportsListResponse | undefined): boolean {
    if (!response) return false;
    const { sections, closedEvents } = groupSportsEventsForDisplay(response);
    return sections.length > 0 || closedEvents.length > 0;
}

export function categoryHasPropsDisplayContent(events: PolymarketEventListData[] | undefined): boolean {
    return (events?.length ?? 0) > 0;
}

export interface ResolveCategoryGamesPropsTabsInput {
    showGamesPropsTabs: boolean;
    hasGames: boolean;
    hasProps: boolean;
    hasGroups?: boolean;
    tabFromUrl: PredictionCategoryTab;
    isAvailabilityPending?: boolean;
}

export interface ResolveCategoryGamesPropsTabsResult {
    availableTabs: PredictionCategoryTab[];
    showTabSwitcher: boolean;
    effectiveTab: PredictionCategoryTab;
}

export function resolveCategoryGamesPropsTabs({
    showGamesPropsTabs,
    hasGames,
    hasProps,
    hasGroups = false,
    tabFromUrl,
    isAvailabilityPending = false,
}: ResolveCategoryGamesPropsTabsInput): ResolveCategoryGamesPropsTabsResult {
    if (!showGamesPropsTabs) {
        const availableTabs = hasGroups ? [PREDICTION_CATEGORY_GROUPS_TAB] : [];
        return {
            availableTabs,
            showTabSwitcher: false,
            effectiveTab:
                hasGroups && tabFromUrl === PREDICTION_CATEGORY_GROUPS_TAB
                    ? PREDICTION_CATEGORY_GROUPS_TAB
                    : tabFromUrl,
        };
    }

    const availableTabs: PredictionCategoryTab[] = [];
    if (hasGames) availableTabs.push(PREDICTION_CATEGORY_GAMES_TAB);
    if (hasProps) availableTabs.push(PREDICTION_CATEGORY_PROPS_TAB);
    if (hasGroups) availableTabs.push(PREDICTION_CATEGORY_GROUPS_TAB);

    const showTabSwitcher = !isAvailabilityPending && availableTabs.length >= 2;

    let effectiveTab: PredictionCategoryTab;
    if (availableTabs.length === 0) {
        effectiveTab = PREDICTION_CATEGORY_GAMES_TAB;
    } else if (availableTabs.length === 1) {
        effectiveTab = availableTabs[0];
    } else if (availableTabs.includes(tabFromUrl)) {
        effectiveTab = tabFromUrl;
    } else {
        effectiveTab = availableTabs[0];
    }

    return {
        availableTabs,
        showTabSwitcher,
        effectiveTab,
    };
}
