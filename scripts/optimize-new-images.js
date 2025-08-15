#!/usr/bin/env node

import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 90;
const WEBP_QUALITY = 85;

// Track processed files to avoid duplicate work
const PROCESSED_FILE = path.join(__dirname, '..', '.cache', 'optimized-images.json');

async function loadProcessedFiles() {
    try {
        const data = await fs.readFile(PROCESSED_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveProcessedFiles(processed) {
    try {
        // Ensure cache directory exists
        await fs.mkdir(path.dirname(PROCESSED_FILE), { recursive: true });
        await fs.writeFile(PROCESSED_FILE, JSON.stringify(processed, null, 2));
    } catch (error) {
        console.warn('Warning: Could not save processed files cache:', error.message);
    }
}

async function getFileHash(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return `${stats.size}-${stats.mtime.getTime()}`;
    } catch {
        return null;
    }
}

async function optimizeImage(inputPath, processed = {}) {
    try {
        const fileHash = await getFileHash(inputPath);
        if (!fileHash) {
            console.log(`⚠️  Could not access ${inputPath}`);
            return false;
        }

        // Skip if already processed and unchanged
        if (processed[inputPath] === fileHash) {
            console.log(`⏭️  Skipping ${path.basename(inputPath)} (already optimized)`);
            return false;
        }

        const stats = await fs.stat(inputPath);
        const fileSizeKB = Math.round(stats.size / 1024);

        // Skip if file is already small enough (under 200KB)
        if (fileSizeKB < 200) {
            console.log(`⏭️  Skipping ${path.basename(inputPath)} (${fileSizeKB}KB - already small)`);
            processed[inputPath] = fileHash;
            return false;
        }

        console.log(`🔄 Processing ${path.basename(inputPath)} (${fileSizeKB}KB)`);

        const ext = path.extname(inputPath).toLowerCase();
        const tempPath = inputPath.replace(ext, `.temp${ext}`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Validate image
        if (!metadata.width || !metadata.height) {
            console.log(`⚠️  Invalid image metadata for ${path.basename(inputPath)}`);
            return false;
        }

        // Check if image needs resizing
        const needsResize = metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT;

        let pipeline = image;

        if (needsResize) {
            console.log(`   📐 Resizing from ${metadata.width}x${metadata.height}`);
            pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Apply format-specific optimizations
        if (ext === '.jpg' || ext === '.jpeg') {
            pipeline = pipeline.jpeg({
                quality: JPEG_QUALITY,
                mozjpeg: true,
                progressive: true
            });
        } else if (ext === '.png') {
            pipeline = pipeline.png({
                quality: PNG_QUALITY,
                compressionLevel: 9,
                progressive: true
            });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({
                quality: WEBP_QUALITY,
                effort: 6
            });
        } else {
            console.log(`⏭️  Unsupported format: ${ext}`);
            return false;
        }

        // Save to temp file first
        await pipeline.toFile(tempPath);

        // Check if optimization was effective
        const newStats = await fs.stat(tempPath);
        const newFileSizeKB = Math.round(newStats.size / 1024);
        const savings = fileSizeKB - newFileSizeKB;
        const savingsPercent = Math.round((savings / fileSizeKB) * 100);

        if (savings > 10) { // Only replace if we save at least 10KB
            // Replace original with optimized version
            await fs.rename(tempPath, inputPath);
            console.log(`✅ Optimized ${path.basename(inputPath)}: ${fileSizeKB}KB → ${newFileSizeKB}KB (${savingsPercent}% savings)`);

            // Update processed files with new hash
            const newHash = await getFileHash(inputPath);
            processed[inputPath] = newHash;
            return true;
        } else {
            // Remove temp file if no significant improvement
            await fs.unlink(tempPath);
            console.log(`⏭️  Minimal improvement for ${path.basename(inputPath)} (${savings}KB saved)`);
            processed[inputPath] = fileHash;
            return false;
        }

    } catch (error) {
        console.error(`❌ Error processing ${path.basename(inputPath)}:`, error.message);
        return false;
    }
}

async function findNewImages(sinceMinutes = null) {
    console.log('🔍 Scanning for images...');

    // Find all images in relevant directories
    const imagePatterns = [
        'content/blog/**/*.jpg',
        'content/blog/**/*.jpeg',
        'content/blog/**/*.png',
        'content/blog/**/*.webp',
        'public/img/**/*.jpg',
        'public/img/**/*.jpeg',
        'public/img/**/*.png',
        'public/img/**/*.webp'
    ];

    const allImages = [];
    for (const pattern of imagePatterns) {
        const files = await glob(pattern);
        allImages.push(...files);
    }

    if (sinceMinutes) {
        // Filter to only recent files (useful for CMS integration)
        const cutoffTime = Date.now() - (sinceMinutes * 60 * 1000);
        const recentImages = [];

        for (const imagePath of allImages) {
            try {
                const stats = await fs.stat(imagePath);
                if (stats.mtime.getTime() > cutoffTime) {
                    recentImages.push(imagePath);
                }
            } catch {
                // Skip files we can't access
            }
        }

        console.log(`Found ${recentImages.length} images modified in the last ${sinceMinutes} minutes`);
        return recentImages;
    }

    console.log(`Found ${allImages.length} total images`);
    return allImages;
}

async function main() {
    const args = process.argv.slice(2);
    const sinceMinutes = args.includes('--recent') ? 30 : null;
    const forceAll = args.includes('--force');

    console.log('🚀 Starting image optimization...\n');

    if (sinceMinutes) {
        console.log(`⏰ Processing images modified in the last ${sinceMinutes} minutes\n`);
    }

    const processed = forceAll ? {} : await loadProcessedFiles();
    const images = await findNewImages(sinceMinutes);

    if (images.length === 0) {
        console.log('No images found to process.');
        return;
    }

    console.log(`Processing ${images.length} images...\n`);

    let optimizedCount = 0;
    let totalSavings = 0;

    // Process images one by one to avoid memory issues
    for (const imagePath of images) {
        const wasOptimized = await optimizeImage(imagePath, processed);
        if (wasOptimized) {
            optimizedCount++;
        }
    }

    // Save the processed files cache
    await saveProcessedFiles(processed);

    console.log('\n✨ Image optimization complete!');
    console.log(`📊 Optimized ${optimizedCount} out of ${images.length} images`);

    if (optimizedCount === 0) {
        console.log('💡 All images were already optimized or too small to benefit from optimization.');
    } else {
        console.log('💡 Pro tip: Use --recent flag to only process recently modified images.');
    }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n⏹️  Process interrupted. Cleaning up...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Process terminated. Cleaning up...');
    process.exit(0);
});

main().catch(console.error);
