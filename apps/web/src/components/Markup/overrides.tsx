import type { HTMLProps } from 'react';

export const PlainParagraph = (props: HTMLProps<HTMLParagraphElement>) => props.children;

// Render a markdown link as its plain text instead of an <a>. Use inside a container that
// is itself a link (e.g. a clickable list row) so bio/description links don't produce an
// invalid, hydration-breaking <a> nested inside the outer <a>.
export const PlainLink = (props: HTMLProps<HTMLAnchorElement>) => props.children;

export function VoidLineBreak() {
    return null;
}
