import type { Snap } from '@dimensiondev/workers-snap';

export function validateSnapStructure(snap: Snap): string | null {
    const isV2 = snap.version === '2.0';
    const { root, elements } = snap.ui;
    const elementEntries = Object.entries(elements);

    const maxElements = isV2 ? 64 : 256;
    if (elementEntries.length > maxElements) {
        return `Snap allows at most ${maxElements} elements, received ${elementEntries.length}.`;
    }

    if (!elements[root]) {
        return 'Snap root element is missing from ui.elements.';
    }

    const visited = new Set<string>();
    const stack: Array<{ id: string; depth: number }> = [{ id: root, depth: 1 }];

    while (stack.length) {
        const current = stack.pop()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const element = elements[current.id];
        if (!element) {
            return `Snap references missing element "${current.id}".`;
        }

        const children = element.children ?? [];
        const nextDepth = current.depth + 1;

        if (isV2) {
            if (current.id === root && children.length > 7) {
                return `Snap v2 root supports at most 7 children, received ${children.length}.`;
            }

            if (
                (element.type === 'stack' || element.type === 'item_group') &&
                current.id !== root &&
                children.length > 6
            ) {
                return `Snap v2 ${element.type} "${current.id}" supports at most 6 children, received ${children.length}.`;
            }

            if (nextDepth > 5 && children.length > 0) {
                return 'Snap v2 nesting depth exceeds 4 levels from root to leaf.';
            }
        } else if (nextDepth > 10 && children.length > 0) {
            return 'Snap nesting depth is too deep.';
        }

        for (let index = children.length - 1; index >= 0; index -= 1) {
            stack.push({ id: children[index], depth: nextDepth });
        }
    }

    return null;
}
