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

    for (const line of lines) {
        let processedLine = line;
        if (processedLine.trim().startsWith('```')) {
            inFence = !inFence;
            result.push(processedLine);
            continue;
        }

        if (!inFence) {
            processedLine = processedLine.replace(/^(\s*)([*+-])\s+/, '$1$2 ');
        }

        if (!inFence && listStartRe.test(processedLine)) {
            const prev = result[result.length - 1];
            if (prev !== undefined && prev.trim() !== '' && !listStartRe.test(prev) && !blockquoteRe.test(prev)) {
                result.push('');
            }
            result.push(processedLine);
            continue;
        }

        result.push(processedLine);
    }

    return result.join('\n');
}
