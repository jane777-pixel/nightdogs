#!/usr/bin/env node

import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 90;

async function optimizeImage(inputPath) {
    try {
        const stats = await fs.stat(inputPath);
        const fileSizeKB = Math.round(stats.size / 1024);

        // Skip if file is already small enough (under 500KB)
        if (fileSizeKB < 500) {
            console.log(`⏭️  Skipping ${inputPath} (${fileSizeKB}KB - already optimized)`);
            return;
        }

        console.log(`🔄 Processing ${inputPath} (${fileSizeKB}KB)`);

        const ext = path.extname(inputPath).toLowerCase();
        const tempPath = inputPath.replace(ext, `.temp${ext}`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Check if image needs resizing
        const needsResize = metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT;

        let pipeline = image;

        if (needsResize) {
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
                quality: JPEG_QUALITY,
                effort: 6
            });
        }

        // Save to temp file first
        await pipeline.toFile(tempPath);

        // Check if optimization was effective
        const newStats = await fs.stat(tempPath);
        const newFileSizeKB = Math.round(newStats.size / 1024);
        const savings = fileSizeKB - newFileSizeKB;
        const savingsPercent = Math.round((savings / fileSizeKB) * 100);

        if (savings > 0) {
            // Replace original with optimized version
            await fs.rename(tempPath, inputPath);
            console.log(`✅ Optimized ${path.basename(inputPath)}: ${fileSizeKB}KB → ${newFileSizeKB}KB (${savingsPercent}% savings)`);
        } else {
            // Remove temp file if no improvement
            await fs.unlink(tempPath);
            console.log(`⏭️  No improvement for ${path.basename(inputPath)}`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${inputPath}:`, error.message);
    }
}

async function main() {
    console.log('🚀 Starting image optimization...\n');

    // Find all images in content/blog
    const imagePatterns = [
        'content/blog/**/*.jpg',
        'content/blog/**/*.jpeg',
        'content/blog/**/*.png',
        'content/blog/**/*.webp'
    ];

    const allImages = [];
    for (const pattern of imagePatterns) {
        const files = await glob(pattern);
        allImages.push(...files);
    }

    if (allImages.length === 0) {
        console.log('No images found to optimize.');
        return;
    }

    console.log(`Found ${allImages.length} images to process\n`);

    // Process images one by one to avoid memory issues
    for (const imagePath of allImages) {
        await optimizeImage(imagePath);
    }

    console.log('\n✨ Image optimization complete!');
    console.log('\n💡 Pro tip: Run this script whenever you add new large images to your blog posts.');
}

main().catch(console.error);
