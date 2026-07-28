import type { CSSProperties, ImgHTMLAttributes, ReactElement, Ref } from 'react';

/**
 * Compatibility shim for next/image over a plain <img>. The new SSR app
 * aliases `@/esm/Image.js` here (next/image is Next-only and resolves to a
 * non-component object outside Next).
 */
export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
}

export type StaticImport = StaticImageData | { default: StaticImageData };

export interface ImageCompatProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | StaticImport;
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
    /** next/image layout mode; ignored by this shim. */
    layout?: string;
    /** App-specific fallback shape (e.g. 'square'); ignored by this shim. */
    fallback?: unknown;
    ref?: Ref<HTMLImageElement>;
    style?: CSSProperties;
}

export type ImageProps = ImageCompatProps;

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
    const resolvedSrc = typeof src === 'string' ? src : 'src' in src ? src.src : src.default.src;
    const fillStyle: CSSProperties | undefined = fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
        : undefined;

    return (
        <img
            src={resolvedSrc}
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
