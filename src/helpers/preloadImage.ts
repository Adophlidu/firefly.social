import { skipToken, useQuery } from '@tanstack/react-query';

async function preloadImage(imageUrl: string) {
    const image = new Image();
    image.src = imageUrl;
    await new Promise((resolve) => {
        image.onload = resolve;
    });
}

export function usePreloadImage(imageUrl: string | undefined, enabled = true) {
    return useQuery({
        enabled: !!imageUrl && enabled,
        queryKey: ['system', 'preload-image', imageUrl],
        queryFn: imageUrl ? () => preloadImage(imageUrl) : skipToken,
    });
}
