export function getNextVersion(url: string, document: Document): string | null {
    const script = Array.from(document.querySelectorAll('script')).find((s) => s.innerHTML?.includes('fc:frame'));
    if (!script) return null;

    const matched = script.innerHTML.trim().match(/\\"name\\":\\"fc:frame\\",\\"content\\":\\"((?:\\\\"|[^"])*)\\"\}/);
    if (!matched) return null;

    console.log(`[frame] getNextVersion: found frame metadata from script for url = ${url}`);

    const jsonStr = matched[1].replace(/\\\\\\"/g, '"');
    return jsonStr;
}
