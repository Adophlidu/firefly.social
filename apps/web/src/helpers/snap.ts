import type { Snap } from '@/types/snap.js';

export function isSnap(value: unknown): value is Snap {
    return (
        typeof value === 'object' &&
        value !== null &&
        'version' in value &&
        ((value as Snap).version === '1.0' || (value as Snap).version === '2.0') &&
        'ui' in value
    );
}

export function validateSnapV2Structure(snap: Snap): string | null {
    if (snap.version !== '2.0') return null;

    const { root, elements } = snap.ui;
    const elementEntries = Object.entries(elements);

    if (elementEntries.length > 64) {
        return `Snap v2 allows at most 64 elements, received ${elementEntries.length}.`;
    }

    if (!elements[root]) {
        return 'Snap v2 root element is missing from ui.elements.';
    }

    const visited = new Set<string>();
    const stack: Array<{ id: string; depth: number }> = [{ id: root, depth: 1 }];

    while (stack.length) {
        const current = stack.pop()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const element = elements[current.id];
        if (!element) {
            return `Snap v2 references missing element "${current.id}".`;
        }

        const children = element.children ?? [];

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

        const nextDepth = current.depth + 1;
        if (nextDepth > 5 && children.length > 0) {
            return 'Snap v2 nesting depth exceeds 4 levels from root to leaf.';
        }

        for (let index = children.length - 1; index >= 0; index -= 1) {
            stack.push({ id: children[index], depth: nextDepth });
        }
    }

    return null;
}
