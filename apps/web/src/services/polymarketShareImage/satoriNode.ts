/**
 * Plain-object element factories for satori. The repo's JSX runtime is hono/jsx (nodes carry
 * `tag`/`props`), which satori cannot read (it expects React-shaped `type`/`props`), so the share
 * image trees are built with these helpers instead of JSX.
 */

export interface SatoriNode {
    type: string;
    props: Record<string, unknown>;
}

export type SatoriChild = SatoriNode | string | null;

type Style = Record<string, string | number>;

export function el(type: string, style: Style, ...children: SatoriChild[]): SatoriNode {
    const kids = children.filter((child) => child !== null);
    return {
        type,
        // satori requires explicit flex display on multi-child containers
        props: {
            style: { display: 'flex', ...style },
            children: kids.length === 1 ? kids[0] : kids,
        },
    };
}

export function img(src: string, width: number, height: number, style: Style = {}): SatoriNode {
    return {
        type: 'img',
        props: {
            src,
            width,
            height,
            style: { width, height, ...style },
        },
    };
}
