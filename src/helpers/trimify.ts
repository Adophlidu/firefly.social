export function trimify(value: string) {
    return value.replace(/\n/gi, '&nbsp; \n').trim();
}

export function trimifyPost(value: string) {
    const normalized = value
        .replace(/\r\n?/g, '\n')
        .replace(/\n\n\s*\n/g, '\n\n')
        .trim();

    const lines = normalized.split('\n');
    const result: string[] = [];

    const listStartRe = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/;
    const blockquoteRe = /^\s*>\s*/;
    let inFence = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim().startsWith('```')) {
            inFence = !inFence;
            result.push(line);
            continue;
        }

        if (!inFence) {
            line = line.replace(/^(\s*)\\([*+\-])\s+/, '$1$2 ');
        }

        if (!inFence && listStartRe.test(line)) {
            const prev = result[result.length - 1];
            if (prev !== undefined && prev.trim() !== '' && !listStartRe.test(prev) && !blockquoteRe.test(prev)) {
                result.push('');
            }
            result.push(line);
            continue;
        }

        result.push(line);
    }

    return result.join('\n');
}
