interface Options {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
}

export function computeSize(width: number, height: number, { minWidth, minHeight, maxWidth, maxHeight }: Options) {
    const ratio = width / height;

    if (width < minWidth || width > maxWidth) {
        width = Math.min(Math.max(width, minWidth), maxWidth);
        height = width / ratio;
    }

    if (height < minHeight || height > maxHeight) {
        height = Math.min(Math.max(height, minHeight), maxHeight);
        width = height * ratio;
    }

    return [width, height];
}
