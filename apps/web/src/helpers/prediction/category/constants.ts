/** Primary tabs shown before the vertical divider (display order). */
export const LEADING_PRIMARY_SLUGS = ['trending', 'fifwc', 'new'] as const;

/** Primary slugs that never show the Games tab (includes breaking after the divider). */
export const PINNED_PRIMARY_SLUGS = ['trending', 'breaking', 'new'] as const;

/** Secondary chips pinned before the vertical divider on sports-style categories. */
export const LEADING_SECONDARY_SLUGS = ['live'] as const;

export const PREDICTION_CATEGORY_GAMES_TAB = 'games' as const;
export const PREDICTION_CATEGORY_PROPS_TAB = 'props' as const;
export const PREDICTION_CATEGORY_GROUPS_TAB = 'groups' as const;

export type PredictionCategoryTab =
    | typeof PREDICTION_CATEGORY_GAMES_TAB
    | typeof PREDICTION_CATEGORY_PROPS_TAB
    | typeof PREDICTION_CATEGORY_GROUPS_TAB;

export const SPORTS_CATEGORY_TYPES = new Set(['sport', 'league', 'live']);
