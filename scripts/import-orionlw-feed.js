import Parser from "rss-parser";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FEED_URL = "https://orionlw.me/feed/feed.xml";
const OUTPUT_DIR = path.join(__dirname, "..", "content/blog");

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const parser = new Parser();

// Improved image download function
function downloadImage(url, filepath) {
	return new Promise((resolve, reject) => {
		console.log(`Attempting to download: ${url}`);

		const client = url.startsWith("https:") ? https : http;

		const request = client.get(
			url,
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; RSS-Importer/1.0)",
				},
			},
			(response) => {
				// Handle redirects
				if (
					response.statusCode >= 300 &&
					response.statusCode < 400 &&
					response.headers.location
				) {
					console.log(`Redirecting to: ${response.headers.location}`);
					return downloadImage(response.headers.location, filepath)
						.then(resolve)
						.catch(reject);
				}

				if (response.statusCode !== 200) {
					reject(
						new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
					);
					return;
				}

				const file = fs.createWriteStream(filepath);

				response.pipe(file);

				file.on("finish", () => {
					file.close();
					console.log(`Successfully downloaded: ${path.basename(filepath)}`);
					resolve(filepath);
				});

				file.on("error", (err) => {
					fs.unlink(filepath, () => {}); // Delete partial file
					reject(err);
				});
			}
		);

		request.on("error", (err) => {
			reject(err);
		});

		request.setTimeout(10000, () => {
			request.destroy();
			reject(new Error("Download timeout"));
		});
	});
}

// Function to process content and download images
async function processContent(content, slug, postDir) {
	if (!content) return content;

	let processedContent = content;
	const downloadedImages = new Map(); // Track downloaded images by URL

	// Find all picture elements and their images
	const pictureRegex = /<picture[^>]*>.*?<\/picture>/gs;

	// Process picture elements
	let pictureMatch;
	while ((pictureMatch = pictureRegex.exec(content)) !== null) {
		const pictureElement = pictureMatch[0];
		let newPictureElement = pictureElement;

		// Find the main image URL from the img tag within picture
		const imgMatch = pictureElement.match(/<img[^>]+src="([^"]+)"[^>]*>/);
		if (imgMatch) {
			let originalUrl = imgMatch[1];

			// Fix the domain issue - replace example.com with orionlw.me
			if (originalUrl.includes("example.com")) {
				originalUrl = originalUrl.replace(
					"https://example.com",
					"https://orionlw.me"
				);
				console.log(`Fixed URL: ${originalUrl}`);
			}

			if (!originalUrl.startsWith("/") && !originalUrl.startsWith("./")) {
				let relativePath;

				// Check if we've already downloaded this image
				if (downloadedImages.has(originalUrl)) {
					relativePath = downloadedImages.get(originalUrl);
					console.log(`Reusing already downloaded image: ${relativePath}`);
				} else {
					try {
						// Extract filename and extension
						const urlPath = new URL(originalUrl).pathname;
						const extension = path.extname(urlPath) || ".jpg";
						const imageName = `image${extension}`;
						const localPath = path.join(postDir, imageName);
						relativePath = `./${imageName}`; // Relative path for markdown

						// Download the image
						await downloadImage(originalUrl, localPath);

						// Verify file was created and has content
						if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
							// Store the mapping so we don't download again
							downloadedImages.set(originalUrl, relativePath);
							console.log(`✓ Successfully downloaded image: ${imageName}`);
						} else {
							console.warn(
								`✗ Image file is empty or doesn't exist: ${imageName}`
							);
							continue;
						}
					} catch (error) {
						console.warn(
							`✗ Failed to download image ${originalUrl}:`,
							error.message
						);
						continue;
					}
				}

				// Replace the entire picture element with just the img tag
				const altText = extractAltText(pictureElement);
				newPictureElement = `<img loading="lazy" decoding="async" src="${relativePath}" alt="${altText}" />`;
			}
		}

		// Replace the picture element in content
		processedContent = processedContent.replace(
			pictureElement,
			newPictureElement
		);
	}

	return processedContent;
}

// Helper function to extract alt text
function extractAltText(element) {
	const altMatch = element.match(/alt="([^"]*)"/);
	return altMatch ? altMatch[1] : "";
}

(async () => {
	try {
		const feed = await parser.parseURL(FEED_URL);

		// Get existing directories to avoid duplicates
		const existingDirs = new Set();
		if (fs.existsSync(OUTPUT_DIR)) {
			fs.readdirSync(OUTPUT_DIR, { withFileTypes: true }).forEach((dirent) => {
				if (dirent.isDirectory()) {
					existingDirs.add(dirent.name);
				}
			});
		}

		let importedCount = 0;
		let skippedCount = 0;

		// Test with just one post first
		for (const item of feed.items.slice(0, 1)) {
			const slug = item.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			const postDir = path.join(OUTPUT_DIR, slug);
			const markdownFile = path.join(postDir, "index.md");

			// Skip if directory already exists
			if (existingDirs.has(slug)) {
				console.log(`Skipping existing post: ${slug}/`);
				skippedCount++;
				continue;
			}

			// Create post directory
			fs.mkdirSync(postDir, { recursive: true });

			const date = new Date(item.pubDate).toISOString();

			console.log(`\nProcessing: ${item.title}`);
			console.log(`Creating directory: ${slug}/`);
			console.log(`Original content length: ${(item.content || "").length}`);

			// Process content and download images
			const processedContent = await processContent(
				item.content || item.contentSnippet || "",
				slug,
				postDir
			);

			console.log(`Processed content length: ${processedContent.length}`);

			// Build frontmatter
			const frontmatter = `---
title: "${item.title.replace(/"/g, "'")}"
date: ${date}
author: orionlw
tags:
  - posts
---

${processedContent}
`;

			// Write markdown file
			fs.writeFileSync(markdownFile, frontmatter);
			console.log(`✓ Imported: ${slug}/index.md`);
			importedCount++;
		}

		// Import all posts now!
		for (const item of feed.items) {
			const slug = item.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			const postDir = path.join(OUTPUT_DIR, slug);
			const markdownFile = path.join(postDir, "index.md");

			// Skip if directory already exists
			if (existingDirs.has(slug)) {
				console.log(`Skipping existing post: ${slug}/`);
				skippedCount++;
				continue;
			}

			// Create post directory
			fs.mkdirSync(postDir, { recursive: true });

			const date = new Date(item.pubDate).toISOString();

			console.log(`\nProcessing: ${item.title}`);
			console.log(`Creating directory: ${slug}/`);
			console.log(`Original content length: ${(item.content || "").length}`);

			// Process content and download images
			const processedContent = await processContent(
				item.content || item.contentSnippet || "",
				slug,
				postDir
			);

			console.log(`Processed content length: ${processedContent.length}`);

			// Build frontmatter
			const frontmatter = `---
title: "${item.title.replace(/"/g, "'")}"
date: ${date}
author: orionlw
tags:
  - posts
---

${processedContent}
`;

			// Write markdown file
			fs.writeFileSync(markdownFile, frontmatter);
			console.log(`✓ Imported: ${slug}/index.md`);
			importedCount++;
		}

		console.log(`\n=== Import Summary ===`);
		console.log(`Imported: ${importedCount} new posts`);
		console.log(`Skipped: ${skippedCount} existing posts`);
	} catch (error) {
		console.error("Error importing feed:", error);
	}
})();
