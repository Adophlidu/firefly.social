export function convertToYouTubeEmbedUrl(url: string): string {
    if (url.includes('/embed/')) {
        return url;
    }

    let videoId: string | null = null;

    const watchMatch = url.match(/[?&]v=([\w-]+)/);
    if (watchMatch) {
        videoId = watchMatch[1];
    }

    if (!videoId) {
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }
    }

    if (!videoId) {
        const shortsMatch = url.match(/\/shorts\/([\w-]+)/);
        if (shortsMatch) {
            videoId = shortsMatch[1];
        }
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
}
