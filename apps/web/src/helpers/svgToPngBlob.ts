/**
 * Rasterizes an SVG string to a PNG Blob using the browser's native renderer
 * (`Image` -> `<canvas>` -> `toBlob`). Unlike a wasm rasterizer (resvg, used by the
 * share-image worker), the browser decodes embedded `webp`/`avif` data URIs natively,
 * so webp avatars render instead of falling back to a placeholder.
 *
 * Every image referenced by the SVG must be a same-origin/`data:` URI; a cross-origin
 * `<image href>` without CORS taints the canvas and makes `toBlob` throw a SecurityError.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load SVG into an image'));
        image.src = src;
    });
}

export async function svgToPngBlob(svg: string, width: number, height: number, scale = 1): Promise<Blob> {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get a 2d canvas context');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
                'image/png',
            );
        });
    } finally {
        URL.revokeObjectURL(url);
    }
}
