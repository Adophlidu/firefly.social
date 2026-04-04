function stripProtocol(str: string) {
    return str.replace(/^https?:\/\//, '');
}

export function removeAtEnd(content: string, fragment: string): string {
    content = content.trimEnd();

    const bare = stripProtocol(fragment);
    if (content.endsWith(bare)) {
        return content
            .slice(0, content.lastIndexOf(bare))
            .replace(/https?:\/\/$/, '')
            .trimEnd();
    }

    return content;
}
