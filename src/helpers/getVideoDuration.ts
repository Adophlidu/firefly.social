/**
 * Get the duration of a video file.
 * @param file The video file.
 * @returns The duration of the video in seconds.
 */
export function getVideoDuration(file: File) {
    return new Promise<number>((resolve) => {
        const video = document.createElement('video');
        const onLoadRejected = () => {
            URL.revokeObjectURL(video.src);
            resolve(0);
        };

        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = onLoadRejected;
        video.onabort = onLoadRejected;

        video.src = URL.createObjectURL(file);
    });
}
