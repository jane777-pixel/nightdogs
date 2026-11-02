#!/usr/bin/env node
// Shrinks oversized photos in content/blog so the repo and builds stay lean.
// Safe to run repeatedly: images that already fit are left untouched, so
// photos don't lose quality from being re-compressed on every run.
//
// Usage: node scripts/optimize-images.js [files...]
//   With no arguments, scans every image under content/blog.

import sharp from "sharp";
import { glob } from "glob";
import path from "node:path";
import fs from "node:fs/promises";

const MAX_SIZE = 2400; // longest edge, in pixels
const MAX_BYTES = 1.5 * 1024 * 1024; // re-encode anything bigger than this
const JPEG_QUALITY = 82;

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function optimizeImage(inputPath) {
	const ext = path.extname(inputPath).toLowerCase();
	if (!SUPPORTED.has(ext)) return false;

	const { size } = await fs.stat(inputPath);
	const metadata = await sharp(inputPath).metadata();
	// EXIF orientations 5-8 mean width/height are swapped on display
	const rotated = (metadata.orientation ?? 1) >= 5;
	const width = rotated ? metadata.height : metadata.width;
	const height = rotated ? metadata.width : metadata.height;
	const tooBig = Math.max(width, height) > MAX_SIZE;

	if (!tooBig && size <= MAX_BYTES) return false;

	// .rotate() bakes the EXIF orientation into the pixels so phone photos
	// don't end up sideways once the metadata is stripped.
	let pipeline = sharp(inputPath).rotate();
	if (tooBig) {
		pipeline = pipeline.resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true });
	}
	if (ext === ".png") {
		pipeline = pipeline.png({ compressionLevel: 9, palette: false });
	} else if (ext === ".webp") {
		pipeline = pipeline.webp({ quality: JPEG_QUALITY });
	} else {
		pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true });
	}

	const output = await pipeline.toBuffer();
	if (output.length >= size && !tooBig) return false;

	await fs.writeFile(inputPath, output);
	const kb = (n) => Math.round(n / 1024);
	console.log(`✅ ${inputPath}: ${kb(size)}KB → ${kb(output.length)}KB`);
	return true;
}

async function main() {
	const args = process.argv.slice(2);
	const files = args.length
		? args
		: await glob("content/blog/**/*.{jpg,jpeg,png,webp}", { nocase: true });

	let changed = 0;
	for (const file of files) {
		try {
			if (await optimizeImage(file)) changed++;
		} catch (error) {
			console.error(`❌ ${file}: ${error.message}`);
		}
	}
	console.log(`Checked ${files.length} image(s), optimized ${changed}.`);
}

main();
