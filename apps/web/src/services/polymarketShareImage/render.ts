// Polymarket share-image layout (redesign — Figma 84050:57293 event / 84050:57187 sports / 84050:57504
// winnings). The decorative shell (gradient, dark ticket card, side text, sparkles, perforation dots,
// firefly.social wordmark) is pre-rendered into SHARE_IMAGE_FRAME; satori only overlays the dynamic
// content on top with absolute positioning. Built at 2x of the 375x530 design.
import type {
    PolymarketSharePositionParams,
    PolymarketShareSportInfo,
    PolymarketShareWinningsParams,
} from '@/helpers/polymarketShareImage.js';
import { formatSignedPercent, formatSignedUsd, formatUsd, isFullLoss } from '@/services/polymarketShareImage/format.js';
import { SHARE_IMAGE_FRAME } from '@/services/polymarketShareImage/frame.js';
import { el, img, type SatoriChild, type SatoriNode } from '@/services/polymarketShareImage/satoriNode.js';

// 2x of the 375x530 design → crisp text and a 1:1 background frame.
export const SHARE_IMAGE_WIDTH = 750;
export const SHARE_IMAGE_HEIGHT = 1060;
// Winnings list: show up to 3 rows; when there are more, show 2 rows + a "+N more" line.
export const MAX_WINNING_ROWS = 3;

const S = 2;

const GREEN = '#0cbb75';
const RED = '#fa4646';
const GREEN_GRADIENT = 'linear-gradient(180deg, #63ffc1, #0cbb75)';
const RED_GRADIENT = 'linear-gradient(180deg, #ff9090, #fa4646)';
const TEXT_SECOND = 'rgba(255,255,255,0.6)';
const PLACEHOLDER_BG = 'rgba(255,255,255,0.18)';

// Faint dashed body divider (Figma 84050:57302), drawn only on the event/sports cards — the winnings
// card has no divider, so it is not baked into the frame. Tiny rasterized PNG of the dashed line.
const DASHED_DIVIDER =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfgAAAACCAYAAAC0Vs60AAAABmJLR0QA/wD/AP+gvaeTAAAALklEQVRIie3JsQ0AIAwEsTzDMhTLhjYrgOzudOnuXUOSM9v3fd/3/ff+KgDgOxd2SPwECyr+LQAAAABJRU5ErkJggg==';

function dashedDivider(): SatoriNode {
    return el('div', { position: 'absolute', left: 61.5 * S, top: 340 * S }, img(DASHED_DIVIDER, 252 * S, S));
}

export interface ShareImageAssets {
    /** User avatar (data URI) or null → render the name initial. */
    avatar: string | null;
    /** Event-card market icon (data URI). */
    marketIcon: string | null;
    /** Sports-card team logos / flags (data URIs). */
    homeLogo: string | null;
    awayLogo: string | null;
    /** Sports-card predicted-side badge logo (data URI); null for a "DRAW" pick. */
    predictedLogo: string | null;
}

function pnlGradient(positive: boolean) {
    return positive ? GREEN_GRADIENT : RED_GRADIENT;
}

function pnlColor(positive: boolean) {
    return positive ? GREEN : RED;
}

function avatar(src: string | null, name: string, size: number, radius: number): SatoriNode {
    if (src) return img(src, size, size, { borderRadius: radius });
    const initial = (name.trim()[0] ?? '?').toUpperCase();
    return el(
        'div',
        {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: PLACEHOLDER_BG,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.5,
            fontWeight: 700,
        },
        initial,
    );
}

function logoBox(src: string | null, size: number, radius: number): SatoriNode {
    return src
        ? img(src, size, size, { borderRadius: radius })
        : el('div', { width: size, height: size, borderRadius: radius, backgroundColor: PLACEHOLDER_BG });
}

function rootContainer(...children: SatoriChild[]): SatoriNode {
    return el(
        'div',
        {
            position: 'relative',
            width: SHARE_IMAGE_WIDTH,
            height: SHARE_IMAGE_HEIGHT,
            backgroundImage: `url(${SHARE_IMAGE_FRAME})`,
            backgroundSize: `${SHARE_IMAGE_WIDTH}px ${SHARE_IMAGE_HEIGHT}px`,
            color: '#ffffff',
            fontFamily: 'Inter',
        },
        ...children,
    );
}

// Shared body: the big gradient PnL% headline and the bordered sub-amount pill — identical position
// on the event and sports cards.
function pnlHeadline(label: string, positive: boolean): SatoriNode {
    return el(
        'div',
        { position: 'absolute', left: 0, top: 217.74 * S, width: SHARE_IMAGE_WIDTH, justifyContent: 'center' },
        el(
            'div',
            {
                fontSize: 48 * S,
                fontWeight: 700,
                lineHeight: `${48 * S}px`,
                backgroundImage: pnlGradient(positive),
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
            },
            label,
        ),
    );
}

// Top/bottom accent line: a horizontal gradient that fades to transparent at both ends (Figma uses a
// gradient stroke, not a solid border).
function accentLine(color: string): SatoriNode {
    return el('div', {
        height: S,
        width: '100%',
        backgroundImage: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    });
}

function subAmountPill(label: string, positive: boolean): SatoriNode {
    const color = pnlColor(positive);
    return el(
        'div',
        { position: 'absolute', left: 0, top: 275.74 * S, width: SHARE_IMAGE_WIDTH, justifyContent: 'center' },
        el(
            'div',
            { flexDirection: 'column', alignItems: 'stretch' },
            accentLine(color),
            el(
                'div',
                {
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 6 * S,
                    paddingBottom: 6 * S,
                    paddingLeft: 24 * S,
                    paddingRight: 24 * S,
                    fontSize: 14 * S,
                    fontWeight: 600,
                    color,
                },
                label,
            ),
            accentLine(color),
        ),
    );
}

/** sub-amount text: "WON +$x" / "LOST -$x" when settled, else the signed current PnL. */
function subAmountLabel(params: PolymarketSharePositionParams): string {
    const pnl = params.currentPnl ?? 0;
    if (params.status === 'won') return `WON ${formatSignedUsd(pnl)}`;
    if (params.status === 'lost') return `LOST ${formatUsd(pnl)}`;
    return formatSignedUsd(pnl);
}

function headlineLabel(params: PolymarketSharePositionParams): { label: string; positive: boolean } {
    if (isFullLoss(params.pnlRate)) return { label: 'Full Loss', positive: false };
    return { label: formatSignedPercent(params.pnlRate), positive: params.pnlRate >= 0 };
}

function buildEventCard(params: PolymarketSharePositionParams, assets: ShareImageAssets): SatoriNode {
    const { label, positive } = headlineLabel(params);
    return rootContainer(
        // market icon (Figma 84050:57385 — 64x64 at x53/y88; its right edge sits 12.5px from the title)
        el('div', { position: 'absolute', left: 53 * S, top: 88 * S }, logoBox(assets.marketIcon, 64 * S, 16 * S)),
        // title
        el(
            'div',
            {
                position: 'absolute',
                left: 129.5 * S,
                top: 84 * S,
                width: 191.215 * S,
                display: 'block',
                lineClamp: 3,
                fontSize: 18 * S,
                fontWeight: 600,
                lineHeight: `${24 * S}px`,
                color: '#ffffff',
            },
            params.title,
        ),
        pnlHeadline(label, positive),
        subAmountPill(subAmountLabel(params), positive),
        dashedDivider(),
        // outcome
        el(
            'div',
            { position: 'absolute', left: 0, top: 361.7 * S, width: SHARE_IMAGE_WIDTH, justifyContent: 'center' },
            el(
                'div',
                { fontSize: 24 * S, fontWeight: 600, lineHeight: `${32 * S}px`, color: '#ffffff' },
                params.outcome,
            ),
        ),
        // user
        el(
            'div',
            {
                position: 'absolute',
                left: 0,
                top: 412.78 * S,
                width: SHARE_IMAGE_WIDTH,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8 * S,
            },
            avatar(assets.avatar, params.identity.displayName, 24 * S, 12 * S),
            el('div', { fontSize: 14 * S, fontWeight: 600 }, params.identity.displayName),
        ),
    );
}

function predictedBadge(sport: PolymarketShareSportInfo, assets: ShareImageAssets): SatoriNode {
    if (sport.predicted.kind === 'draw') {
        return el('div', { fontSize: 20 * S, fontWeight: 700, color: '#ffffff' }, 'DRAW');
    }
    return logoBox(assets.predictedLogo, 48 * S, 12 * S);
}

function teamGroup(name: string, logo: string | null, side: 'home' | 'away'): SatoriNode {
    const logoNode = logoBox(logo, 24 * S, 4 * S);
    const nameNode = el(
        'div',
        { fontSize: 12 * S, fontWeight: 500, color: '#ffffff', lineClamp: 1, display: 'block', overflow: 'hidden' },
        name,
    );
    return el(
        'div',
        {
            flexGrow: 1,
            flexBasis: 0,
            alignItems: 'center',
            gap: 4 * S,
            justifyContent: side === 'home' ? 'flex-end' : 'flex-start',
        },
        ...(side === 'home' ? [nameNode, logoNode] : [logoNode, nameNode]),
    );
}

function buildSportsCard(params: PolymarketSharePositionParams, assets: ShareImageAssets): SatoriNode {
    const sport = params.sport!;
    const { label, positive } = headlineLabel(params);
    const scoreText = sport.score ? `${sport.score[0]} : ${sport.score[1]}` : 'vs.';

    return rootContainer(
        // header: user (left) + predicted badge (right)
        el(
            'div',
            {
                position: 'absolute',
                left: (375 / 2 - 130) * S,
                top: 92.57 * S,
                width: 260 * S,
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            el(
                'div',
                { alignItems: 'center', gap: 8 * S },
                avatar(assets.avatar, params.identity.displayName, 48 * S, 24 * S),
                el('div', { fontSize: 14 * S, fontWeight: 600 }, params.identity.displayName),
            ),
            predictedBadge(sport, assets),
        ),
        pnlHeadline(label, positive),
        subAmountPill(subAmountLabel(params), positive),
        dashedDivider(),
        // matchup: home (logo+name) — score — away (logo+name)
        el(
            'div',
            {
                position: 'absolute',
                left: (375 / 2 - 134) * S,
                top: 381.01 * S,
                width: 268 * S,
                alignItems: 'center',
                gap: 8 * S,
            },
            teamGroup(sport.home.name, assets.homeLogo, 'home'),
            el('div', { fontSize: 12 * S, fontWeight: 500, color: TEXT_SECOND }, scoreText),
            teamGroup(sport.away.name, assets.awayLogo, 'away'),
        ),
    );
}

export function buildPositionTree(params: PolymarketSharePositionParams, assets: ShareImageAssets): SatoriNode {
    return params.sport ? buildSportsCard(params, assets) : buildEventCard(params, assets);
}

function winningsRow(item: PolymarketShareWinningsParams['items'][number], icon: string | null): SatoriNode {
    return el(
        'div',
        { alignItems: 'center', gap: 8 * S, width: '100%' },
        logoBox(icon, 40 * S, 8 * S),
        el(
            'div',
            { flexDirection: 'column', flexGrow: 1, flexBasis: 0, gap: 4 * S, justifyContent: 'center' },
            el(
                'div',
                {
                    width: '100%',
                    display: 'block',
                    lineClamp: 1,
                    overflow: 'hidden',
                    fontSize: 14 * S,
                    fontWeight: 500,
                    lineHeight: `${18 * S}px`,
                    color: '#ffffff',
                },
                item.title,
            ),
            el(
                'div',
                { fontSize: 13 * S, fontWeight: 400, lineHeight: `${17 * S}px`, color: GREEN },
                `Won ${formatUsd(item.won)}`,
            ),
        ),
    );
}

/**
 * Multi-market winnings "TOTAL WON" card (Figma 84050:57504 / 84050:57392). Shows up to 3 rows; when
 * there are more, shows 2 rows + a "+N more markets won $X" line. `icons` is aligned to the first
 * MAX_WINNING_ROWS items.
 */
export function buildWinningsTree(
    params: PolymarketShareWinningsParams,
    assets: ShareImageAssets,
    icons: Array<string | null>,
): SatoriNode {
    const overflow = params.items.length > MAX_WINNING_ROWS;
    const visible = overflow ? params.items.slice(0, 2) : params.items.slice(0, MAX_WINNING_ROWS);
    const hidden = params.items.length - visible.length;
    const remaining = Math.max(0, params.totalWon - visible.reduce((sum, item) => sum + item.won, 0));

    return rootContainer(
        // TOTAL WON header
        el(
            'div',
            {
                position: 'absolute',
                left: 58.5 * S,
                top: 87 * S,
                width: 258 * S,
                flexDirection: 'column',
                alignItems: 'center',
            },
            el(
                'div',
                {
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: 14 * S,
                    fontWeight: 700,
                    lineHeight: `${18 * S}px`,
                    color: '#ffffff',
                },
                'TOTAL WON',
            ),
            el(
                'div',
                {
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: 40 * S,
                    fontWeight: 700,
                    lineHeight: `${48 * S}px`,
                    backgroundImage: GREEN_GRADIENT,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                },
                formatUsd(params.totalWon),
            ),
        ),
        // winning markets list
        el(
            'div',
            {
                position: 'absolute',
                left: 53.5 * S,
                top: 223.83 * S,
                width: 268 * S,
                flexDirection: 'column',
                gap: 16 * S,
            },
            ...visible.map((item, index) => winningsRow(item, icons[index] ?? null)),
        ),
        // "+N more markets won $X"
        hidden > 0
            ? el(
                  'div',
                  {
                      position: 'absolute',
                      left: 53.5 * S,
                      top: 345.83 * S,
                      width: 268 * S,
                      alignItems: 'center',
                      gap: 5,
                  },
                  el(
                      'div',
                      { fontSize: 14 * S, fontWeight: 500, lineHeight: `${20 * S}px`, color: '#ffffff' },
                      `+${hidden} more markets won`,
                  ),
                  el(
                      'div',
                      { fontSize: 14 * S, fontWeight: 500, lineHeight: `${20 * S}px`, color: GREEN },
                      formatUsd(remaining),
                  ),
              )
            : null,
        // user
        el(
            'div',
            {
                position: 'absolute',
                left: 0,
                top: 412.78 * S,
                width: SHARE_IMAGE_WIDTH,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8 * S,
            },
            avatar(assets.avatar, params.identity.displayName, 24 * S, 12 * S),
            el('div', { fontSize: 14 * S, fontWeight: 600 }, params.identity.displayName),
        ),
    );
}
