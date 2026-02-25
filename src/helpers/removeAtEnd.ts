function stripProtocol(str: string) {
    return str.replace(/^https?:\/\//, '');
}

export function removeAtEnd(content: string, fragment: string): string {
    content = content.trimEnd();

    const bare = stripProtocol(fragment);
    const indexOfUrl = content.indexOf(bare);
    if (indexOfUrl === -1) return content;

    if (indexOfUrl === content.length - bare.length) {
        return content.replace(bare, '');
    }

    return content;
}
