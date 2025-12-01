#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get BASE_URL from environment variable, default to https://firefly.social
const BASE_URL = process.env.BASE_URL || 'https://firefly.social';

// Image comparison pairs: [dynamicUrl, staticPath]
const imagePairs = [
    {
        dynamicUrl: `${BASE_URL}/api/og/post/lens/2ecagsf2kkzgcyfxdf4/image`,
        staticPath: 'public/og/post_lens_2ecagsf2kkzgcyfxdf4_image.png',
    },
    {
        dynamicUrl: `${BASE_URL}/api/og/profile/farcaster/fireflyapp/image`,
        staticPath: 'public/og/profile_farcaster_fireflyapp_image.png',
    },
    {
        dynamicUrl: `${BASE_URL}/api/og/swap/1/0xd650cbe2a82b0c996770807f0fa0cf17b86bd0ccd0457efd6495efcc6b3cefbb/image`,
        staticPath: 'public/og/swap_10_0xd650cbe2a82b0c996770807f0fa0cf17b86bd0ccd0457efd6495efcc6b3cefbb_image.png',
    },
    {
        dynamicUrl: `${BASE_URL}/api/og/tip/0x6295f5852d76b3eabac63d73ed3cb64bfeac47fdd7f1a7412dd7590d3565cd50/image`,
        staticPath: 'public/og/tip_0x6295f5852d76b3eabac63d73ed3cb64bfeac47fdd7f1a7412dd7590d3565cd50_image.png',
    },
];

// Configuration
const THRESHOLD = 0.01; // 1% difference threshold
const OUTPUT_DIR = join(projectRoot, '.image-comparison');

/**
 * Download an image from a URL
 */
async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        throw new Error(`Error downloading ${url}: ${error.message}`);
    }
}

/**
 * Load and normalize an image to PNG format with consistent dimensions
 */
async function loadImage(buffer) {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Convert to PNG and ensure consistent format
        const pngBuffer = await image.png().toBuffer();

        return { buffer: pngBuffer, width: metadata.width, height: metadata.height };
    } catch (error) {
        throw new Error(`Error processing image: ${error.message}`);
    }
}

/**
 * Compare two images using pixelmatch
 */
async function compareImages(image1Buffer, image2Buffer, width, height, outputPath) {
    const img1 = PNG.sync.read(image1Buffer);
    const img2 = PNG.sync.read(image2Buffer);

    // Ensure both images have the same dimensions
    if (img1.width !== img2.width || img1.height !== img2.height) {
        throw new Error(`Image dimensions mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`);
    }

    const diff = new PNG({ width: img1.width, height: img1.height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
        threshold: 0.1,
        alpha: 0.1,
        diffColor: [255, 0, 0], // Red for differences
        diffColorAlt: [0, 0, 255], // Blue for differences
    });

    const totalPixels = img1.width * img1.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    // Save diff image if there are differences
    if (numDiffPixels > 0 && outputPath) {
        await writeFile(outputPath, PNG.sync.write(diff));
    }

    return {
        numDiffPixels,
        totalPixels,
        diffPercentage,
        matches: diffPercentage <= THRESHOLD * 100,
    };
}

/**
 * Main comparison function
 */
async function main() {
    console.log('Starting image comparison...\n');

    // Create output directory
    if (!existsSync(OUTPUT_DIR)) {
        await mkdir(OUTPUT_DIR, { recursive: true });
    }

    const results = [];
    let hasFailures = false;

    for (const pair of imagePairs) {
        const { dynamicUrl, staticPath } = pair;
        const staticFullPath = join(projectRoot, staticPath);
        const filename = staticPath.split('/').pop().replace('.png', '');

        console.log(`Comparing: ${dynamicUrl}`);
        console.log(`  vs: ${staticPath}`);

        try {
            // Check if static image exists
            if (!existsSync(staticFullPath)) {
                throw new Error(`Static image not found: ${staticPath}`);
            }

            // Download dynamic image
            console.log('  Downloading dynamic image...');
            const dynamicImageBuffer = await downloadImage(dynamicUrl);

            // Load static image
            console.log('  Loading static image...');
            const staticImageBuffer = await readFile(staticFullPath);

            // Process both images
            const dynamicImage = await loadImage(dynamicImageBuffer);
            const staticImage = await loadImage(staticImageBuffer);

            // Resize images to match if dimensions differ
            let finalDynamic = dynamicImage.buffer;
            let finalStatic = staticImage.buffer;
            let finalWidth = staticImage.width;
            let finalHeight = staticImage.height;

            if (dynamicImage.width !== staticImage.width || dynamicImage.height !== staticImage.height) {
                console.log(
                    `  Resizing dynamic image from ${dynamicImage.width}x${dynamicImage.height} to ${staticImage.width}x${staticImage.height}`,
                );
                finalDynamic = await sharp(dynamicImage.buffer)
                    .resize(staticImage.width, staticImage.height, { fit: 'contain' })
                    .png()
                    .toBuffer();
            }

            // Compare images
            console.log('  Comparing images...');
            const diffPath = join(OUTPUT_DIR, `${filename}.diff.png`);
            const comparison = await compareImages(finalDynamic, finalStatic, finalWidth, finalHeight, diffPath);

            // Save downloaded dynamic image for reference
            const downloadedPath = join(OUTPUT_DIR, `${filename}.downloaded.png`);
            await writeFile(downloadedPath, finalDynamic);

            const result = {
                dynamicUrl,
                staticPath,
                ...comparison,
                status: comparison.matches ? 'PASS' : 'FAIL',
            };

            results.push(result);

            if (comparison.matches) {
                console.log(
                    `  ✓ PASS: ${comparison.diffPercentage.toFixed(2)}% difference (threshold: ${THRESHOLD * 100}%)\n`,
                );
            } else {
                console.log(
                    `  ✗ FAIL: ${comparison.diffPercentage.toFixed(2)}% difference (threshold: ${THRESHOLD * 100}%)`,
                );
                console.log(`    Diff image saved to: ${diffPath}\n`);
                hasFailures = true;
            }
        } catch (error) {
            console.error(`  ✗ ERROR: ${error.message}\n`);
            results.push({
                dynamicUrl,
                staticPath,
                status: 'ERROR',
                error: error.message,
            });
            hasFailures = true;
        }
    }

    // Print summary
    console.log('\n=== Summary ===');
    results.forEach((result) => {
        if (result.status === 'PASS') {
            console.log(`✓ ${result.staticPath}: ${result.diffPercentage.toFixed(2)}% difference`);
        } else if (result.status === 'FAIL') {
            console.log(`✗ ${result.staticPath}: ${result.diffPercentage.toFixed(2)}% difference (exceeds threshold)`);
        } else {
            console.log(`✗ ${result.staticPath}: ${result.error}`);
        }
    });

    // Exit with error code if any comparisons failed
    if (hasFailures) {
        console.log('\n❌ Some image comparisons failed!');
        process.exit(1);
    } else {
        console.log('\n✅ All image comparisons passed!');
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
