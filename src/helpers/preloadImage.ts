import { skipToken, useQuery } from '@tanstack/react-query';

export async function preloadImage(imageUrl: string) {
    const image = new Image();
    image.src = imageUrl;
    await new Promise((resolve) => {
        image.onload = resolve;
    });
}

export function usePreloadImage(imageUrl: string | undefined) {
    return useQuery({
        enabled: !!imageUrl,
        queryKey: ['system', 'preload-image', imageUrl],
        queryFn: imageUrl ? () => preloadImage(imageUrl) : skipToken,
    });
}
