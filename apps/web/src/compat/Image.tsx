import type { CSSProperties, ImgHTMLAttributes, ReactElement } from 'react';

/**
 * Compatibility shim for next/image over a plain <img>. The new SSR app
 * aliases `@/esm/Image.js` here (next/image is Next-only and resolves to a
 * non-component object outside Next).
 */
export interface ImageCompatProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string;
    alt: string;
    width?: number | `${number}`;
    height?: number | `${number}`;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    placeholder?: string;
    blurDataURL?: string;
    loader?: unknown;
    unoptimized?: boolean;
    style?: CSSProperties;
}

export function Image({
    src,
    alt,
    width,
    height,
    fill,
    priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    loader: _loader,
    unoptimized: _unoptimized,
    style,
    ...rest
}: ImageCompatProps): ReactElement {
    const fillStyle: CSSProperties | undefined = fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
        : undefined;

    return (
        <img
            src={src}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            style={{ ...fillStyle, ...style }}
            {...rest}
        />
    );
}
