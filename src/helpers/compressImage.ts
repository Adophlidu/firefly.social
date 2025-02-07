function containImage(
    w: number,
    h: number,
    { width: maxW, height: maxH }: { width: number; height: number },
): [width: number, height: number] {
    let scale = 1;

    if (w > maxW || h > maxH) {
        scale = w > h ? maxW / w : maxH / h;
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
    }

    return [w, h];
}

async function loadImageFile(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = URL.createObjectURL(file);
    });
}

async function resizeImage(
    file: File,
    image: HTMLImageElement,
    options: {
        width: number;
        height: number;
        quality: number;
        format?: string;
    },
) {
    return new Promise<File>((resolve, reject) => {
        const format = options.format || file.type;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            reject(new Error('Failed to create canvas context'));
            return;
        }

        canvas.width = options.width;
        canvas.height = options.height;
        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, options.width, options.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert canvas to blob'));
                    return;
                }

                resolve(
                    new File([blob], file.name, {
                        type: format,
                        lastModified: file.lastModified,
                    }),
                );
            },
            format,
            options.quality,
        );
    });
}

export async function compressImage(
    file: File,
    options: {
        maxWidth: number;
        maxHeight: number;
        maxSize: number;
        format?: string;
    },
) {
    const image = await loadImageFile(file);
    if (!image?.width || !image.height) {
        throw new Error('Failed to read image dimensions');
    }

    const [expectedWidth, expectedHeight] = containImage(image.width, image.height, {
        width: options.maxWidth,
        height: options.maxHeight,
    });

    for (let i = 10; i > 0; i -= 1) {
        const quality = i / 10;

        const resized = await resizeImage(file, image, {
            width: expectedWidth,
            height: expectedHeight,
            quality,
            format: options.format || file.type,
        });

        if (resized.size <= options.maxSize) {
            return {
                file: resized,
                width: expectedWidth,
                height: expectedHeight,
            };
        }
    }

    throw new Error('Failed to compress image');
}
