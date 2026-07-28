import { Resvg, initResvg, resvgWasmModule } from '@cf-wasm/resvg/edge-light';
import satori, { initSatori, yogaWasmModule } from '@cf-wasm/satori/workerd';
import type { ReactElement } from 'react';
import type { Font } from 'satori';

let ready: Promise<unknown> | undefined;

/**
 * One-time wasm init. Cloudflare Workers forbid runtime wasm compilation,
 * so both modules are statically bound CompiledWasm (wrangler `rules`),
 * provided by the @cf-wasm packages.
 */
function ensureWasm() {
    return (ready ??= Promise.all([initSatori.ensure(), initResvg.ensure()]));
}

export interface OgImageOptions {
    width: number;
    height: number;
    fonts: Font[];
    /** Full Cache-Control header value. */
    cacheControl?: string;
}

/**
 * The worker-native replacement for next/og's ImageResponse: satori renders
 * the element tree to SVG, resvg rasterizes it to PNG.
 */
export async function createOgImageResponse(
    element: ReactElement,
    { width, height, fonts, cacheControl = 'public, max-age=3600' }: OgImageOptions,
): Promise<Response> {
    await ensureWasm();
    const svg = await satori(element, { width, height, fonts });
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: width },
        font: { fontBuffers: fonts.map((font) => new Uint8Array(font.data as ArrayBuffer)) },
    });
    const png = resvg.render().asPng();
    return new Response(png as unknown as BodyInit, {
        headers: {
            'content-type': 'image/png',
            'cache-control': cacheControl,
        },
    });
}
