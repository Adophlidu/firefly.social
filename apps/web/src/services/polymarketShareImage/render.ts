// FW-7696 — share-image layout, ported from firefly-workers so apps/web can render the card on the
// client with satori (no worker round-trip; the browser rasterizer also decodes webp avatars). The
// satori node tree and the frosted-glass SVG post-processing are identical to the worker's.
import type {
    PolymarketSharePositionParams,
    PolymarketShareWinningsItem,
    PolymarketShareWinningsParams,
} from '@/helpers/polymarketShareImage.js';
import { SHARE_IMAGE_BACKGROUND } from '@/services/polymarketShareImage/background.js';
import { formatCents, formatSignedPercent, formatUsd, isFullLoss } from '@/services/polymarketShareImage/format.js';
import { SHARE_IMAGE_LOGO_ASPECT } from '@/services/polymarketShareImage/logo.js';
import { el, img, type SatoriChild, type SatoriNode } from '@/services/polymarketShareImage/satoriNode.js';

export const SHARE_IMAGE_WIDTH = 750;
export const SHARE_IMAGE_HEIGHT = 1200;
export const MAX_WINNING_ROWS = 4;

const GREEN = '#3dc233';
const RED = '#ff3545';
const TEXT_SECOND = 'rgba(255,255,255,0.6)';
const CARD_BG = 'rgba(255,255,255,0.10)';

export interface ShareImageAssets {
    logo: string | null;
    avatar: string | null;
    qr: string;
}

// iOS-style "glass" for the translucent CARD_BG panels (Figma 82833:99179). satori can't render
// `backdrop-filter`, so after layout we blur a copy of the background behind each panel — see
// applyFrostedGlass.
interface GlassStyle {
    blur: number;
    saturate: number;
    darkBase: string;
    highlightTop: number;
    highlightStop: number;
    border: string;
    borderWidth: number;
}

const GLASS: GlassStyle = {
    blur: 30,
    saturate: 1.12,
    darkBase: 'rgba(16,16,22,0.30)',
    highlightTop: 0.12,
    highlightStop: 0.45,
    border: 'rgba(255,255,255,0.30)',
    borderWidth: 1.5,
};

function pnlColor(positive: boolean) {
    return positive ? GREEN : RED;
}

const LOGO_HEIGHT = 48;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * SHARE_IMAGE_LOGO_ASPECT);

function header(assets: ShareImageAssets): SatoriNode {
    return el(
        'div',
        { alignItems: 'center' },
        assets.logo
            ? img(assets.logo, LOGO_WIDTH, LOGO_HEIGHT)
            : el('div', { fontSize: 36, fontWeight: 700, letterSpacing: 2 }, 'FIREFLY'),
    );
}

function footer(name: string, assets: ShareImageAssets): SatoriNode {
    const initial = (name.trim()[0] ?? '?').toUpperCase();
    return el(
        'div',
        { justifyContent: 'space-between', alignItems: 'flex-end' },
        el(
            'div',
            { alignItems: 'center', gap: 16 },
            assets.avatar
                ? img(assets.avatar, 72, 72, { borderRadius: 36 })
                : el(
                      'div',
                      {
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: 'rgba(255,255,255,0.18)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 36,
                          fontWeight: 700,
                      },
                      initial,
                  ),
            el('div', { fontSize: 34, fontWeight: 700 }, name),
        ),
        // Figma 82833:99796 — the QR sits on a square white card with a quiet-zone margin (128 card,
        // 120 code). The card is not rounded: the QR itself has square corners.
        el(
            'div',
            {
                width: 128,
                height: 128,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
            },
            img(assets.qr, 120, 120),
        ),
    );
}

function dataRow(label: string, ...value: SatoriChild[]): SatoriNode {
    return el(
        'div',
        { justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' },
        el('div', { fontSize: 28, color: TEXT_SECOND }, label),
        el('div', { alignItems: 'center', fontSize: 28, fontWeight: 700 }, ...value),
    );
}

// Won/Lost pills — Figma 82833:97933 (Won) / 82833:98552 (Lost).
const WON_GRADIENT = 'linear-gradient(to bottom, #63ffc1, #0cbb75)';
const LOST_GRADIENT = 'linear-gradient(to bottom, #ff9090, #fa4646)';

function statusTag(status: 'won' | 'lost'): SatoriNode {
    return el(
        'div',
        {
            marginLeft: 12,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 16px',
            borderRadius: 24,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 28 / 24,
            backgroundImage: status === 'won' ? WON_GRADIENT : LOST_GRADIENT,
            color: '#ffffff',
        },
        status === 'won' ? 'Won' : 'Lost',
    );
}

function rootContainer(...children: SatoriChild[]): SatoriNode {
    return el(
        'div',
        {
            width: SHARE_IMAGE_WIDTH,
            height: SHARE_IMAGE_HEIGHT,
            flexDirection: 'column',
            padding: 48,
            backgroundImage: `url(${SHARE_IMAGE_BACKGROUND})`,
            backgroundSize: `${SHARE_IMAGE_WIDTH}px ${SHARE_IMAGE_HEIGHT}px`,
            color: '#ffffff',
            fontFamily: 'Inter',
        },
        ...children,
    );
}

function titleBlock(title: string): SatoriNode {
    return el('div', { display: 'block', lineClamp: 3, fontSize: 44, fontWeight: 700, lineHeight: 1.35 }, title);
}

function headline(label: string, positive: boolean): SatoriNode {
    return el('div', { marginTop: 16, fontSize: 76, fontWeight: 700, color: pnlColor(positive) }, label);
}

export function buildPositionTree(params: PolymarketSharePositionParams, assets: ShareImageAssets): SatoriNode {
    const fullLoss = isFullLoss(params.pnlRate);
    const isTimeline = params.variant === 'timeline';
    const closed = params.status !== 'active';

    const headlineLabel = fullLoss ? 'Full Loss' : formatSignedPercent(params.pnlRate);
    const headlinePositive = fullLoss ? false : params.pnlRate >= 0;

    const rows: SatoriChild[] = [
        dataRow(
            isTimeline ? 'Predicted' : 'Outcome',
            el('div', { fontSize: 28, fontWeight: 700 }, params.outcome),
            closed ? statusTag(params.status as 'won' | 'lost') : null,
        ),
        dataRow('Total Cost', formatUsd(params.totalCost)),
        dataRow('Average Price', formatCents(params.avgPrice)),
    ];
    // the PnL row is omitted on the timeline variant and on a -100% full loss
    if (!isTimeline && !fullLoss && params.currentPnl !== undefined) {
        rows.push(
            dataRow(
                closed ? 'PnL' : 'Current PnL',
                el(
                    'div',
                    { fontSize: 28, fontWeight: 700, color: pnlColor(params.currentPnl >= 0) },
                    formatUsd(params.currentPnl),
                ),
            ),
        );
    }

    return rootContainer(
        header(assets),
        el('div', { flexGrow: 1 }),
        titleBlock(params.title),
        headline(headlineLabel, headlinePositive),
        el(
            'div',
            { flexDirection: 'column', marginTop: 48, backgroundColor: CARD_BG, borderRadius: 24, padding: '8px 32px' },
            ...rows,
        ),
        el('div', { flexGrow: 1 }),
        footer(params.identity.displayName, assets),
    );
}

function winningsItemRow(item: PolymarketShareWinningsItem, icon: string | null): SatoriNode {
    return el(
        'div',
        { alignItems: 'center', gap: 20, backgroundColor: CARD_BG, borderRadius: 20, padding: 20 },
        icon
            ? img(icon, 72, 72, { borderRadius: 14 })
            : el('div', { width: 72, height: 72, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' }),
        el(
            'div',
            { flexDirection: 'column', flexGrow: 1, width: 520 },
            el(
                'div',
                { display: 'block', lineClamp: 1, fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
                item.title,
            ),
            el(
                'div',
                { marginTop: 6, fontSize: 26, fontWeight: 700 },
                el('div', {}, `Cost ${formatUsd(item.cost)} • Won `),
                el('div', { color: GREEN }, `${formatUsd(item.won)} (${formatSignedPercent(item.pnlRate)})`),
            ),
        ),
    );
}

export function buildWinningsTree(
    params: PolymarketShareWinningsParams,
    assets: ShareImageAssets,
    icons: Array<string | null>,
): SatoriNode {
    const visible = params.items.slice(0, MAX_WINNING_ROWS);
    const hiddenCount = params.items.length - visible.length;
    const visibleWon = visible.reduce((sum, item) => sum + item.won, 0);
    const remaining = Math.max(0, params.totalWon - visibleWon);

    return rootContainer(
        header(assets),
        el(
            'div',
            {
                justifyContent: 'center',
                marginTop: 24,
                fontSize: 30,
                letterSpacing: 4,
                color: 'rgba(255,255,255,0.85)',
            },
            'TOTAL WON',
        ),
        el(
            'div',
            { justifyContent: 'center', marginTop: 8, fontSize: 84, fontWeight: 700, color: GREEN },
            formatUsd(params.totalWon),
        ),
        el(
            'div',
            { flexDirection: 'column', gap: 20, marginTop: 40 },
            ...visible.map((item, index) => winningsItemRow(item, icons[index] ?? null)),
        ),
        hiddenCount > 0
            ? el(
                  'div',
                  { marginTop: 24, fontSize: 28, fontWeight: 700 },
                  el('div', {}, `+${hiddenCount} more markets won `),
                  el('div', { color: GREEN }, formatUsd(remaining)),
              )
            : null,
        el('div', { flexGrow: 1 }),
        footer(params.identity.displayName, assets),
    );
}

/** A single winning falls back to the closed-position-cell style (spec AC-5). */
export function buildSingleWinningTree(params: PolymarketShareWinningsParams, assets: ShareImageAssets): SatoriNode {
    const [item] = params.items;
    return rootContainer(
        header(assets),
        el('div', { flexGrow: 1 }),
        titleBlock(item.title),
        headline(formatSignedPercent(item.pnlRate), item.pnlRate >= 0),
        el(
            'div',
            { flexDirection: 'column', marginTop: 48, backgroundColor: CARD_BG, borderRadius: 24, padding: '8px 32px' },
            dataRow('Total Cost', formatUsd(item.cost)),
            dataRow('Won', el('div', { fontSize: 28, fontWeight: 700, color: GREEN }, formatUsd(item.won))),
        ),
        el('div', { flexGrow: 1 }),
        footer(params.identity.displayName, assets),
    );
}

/**
 * Gives every translucent `CARD_BG` panel an iOS-style glass backing. satori drops
 * `backdrop-filter`, so we post-process its SVG: each rounded panel emitted as
 * `<path fill="${CARD_BG}" d="…">` is replaced with a stack clipped to the same rounded `d`:
 * a blurred copy of the background, a smoky dark wash, a white top-edge sheen, and a hairline edge.
 */
export function applyFrostedGlass(svg: string, glass: GlassStyle = GLASS): string {
    let count = 0;
    const withGlass = svg.replace(/<path\b[^>]*\/>/g, (tag) => {
        if (!tag.includes(`fill="${CARD_BG}"`)) return tag;
        const d = tag.match(/\bd="([^"]+)"/)?.[1];
        if (!d) return tag;
        const clipId = `pm-glass-${count}`;
        count += 1;
        return (
            `<clipPath id="${clipId}"><path d="${d}"/></clipPath>` +
            `<g clip-path="url(#${clipId})">` +
            `<image href="${SHARE_IMAGE_BACKGROUND}" x="0" y="0" width="${SHARE_IMAGE_WIDTH}" height="${SHARE_IMAGE_HEIGHT}" preserveAspectRatio="none" filter="url(#pm-glass-blur)"/>` +
            `<path d="${d}" fill="${glass.darkBase}"/>` +
            `<path d="${d}" fill="url(#pm-glass-sheen)"/>` +
            `</g>` +
            `<path d="${d}" fill="none" stroke="${glass.border}" stroke-width="${glass.borderWidth}"/>`
        );
    });
    if (count === 0) return svg;
    const filter =
        `<filter id="pm-glass-blur" x="-20%" y="-20%" width="140%" height="140%">` +
        `<feGaussianBlur stdDeviation="${glass.blur}" result="b"/>` +
        `<feColorMatrix in="b" type="saturate" values="${glass.saturate}"/>` +
        `</filter>`;
    const sheen =
        `<linearGradient id="pm-glass-sheen" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="${glass.highlightTop}"/>` +
        `<stop offset="${glass.highlightStop}" stop-color="#fff" stop-opacity="0"/>` +
        `</linearGradient>`;
    return withGlass.replace('</defs>', `${filter}${sheen}</defs>`);
}
