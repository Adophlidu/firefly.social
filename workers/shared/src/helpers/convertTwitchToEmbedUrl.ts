export function convertToTwitchEmbedUrl(url: string, parent: string): string | null {
    if (url.includes('player.twitch.tv') || url.includes('clips.twitch.tv/embed')) {
        const parsed = new URL(url);
        parsed.searchParams.set('parent', parent);
        return parsed.toString();
    }

    // https://www.twitch.tv/videos/123456
    const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (videoMatch) {
        return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${parent}&autoplay=false`;
    }

    // https://www.twitch.tv/channelname (live channel)
    const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
    if (channelMatch && channelMatch[1] !== 'videos') {
        return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${parent}&autoplay=false`;
    }

    // https://clips.twitch.tv/ClipSlug or https://www.twitch.tv/*/clip/ClipSlug
    const clipMatch =
        url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/) || url.match(/twitch\.tv\/\w+\/clip\/([a-zA-Z0-9_-]+)/);
    if (clipMatch) {
        return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&parent=${parent}&autoplay=false`;
    }

    return null;
}
