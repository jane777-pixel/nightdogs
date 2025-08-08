import {
	IdAttributePlugin,
	InputPathToUrlTransformPlugin,
	HtmlBasePlugin,
} from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { DateTime } from "luxon";
import pluginFilters from "./_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
	// Drafts, see also _data/eleventyDataSchema.js
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});

	// Copy the contents of the `public` folder to the output folder
	// For example, `./public/css/` ends up in `_site/css/`
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/",
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl")
		.addPassthroughCopy("content/blog/**/*.{jpg,jpeg,png,gif}")
		.addPassthroughCopy("content/blog/**/*.{mp3,mp4,wav,ogg,m4a}")
		.addPassthroughCopy("content/**/*.mp3") // Passthrough copy for all mp3 files in content
		.addPassthroughCopy("public/js/**/*.js"); // Copy JavaScript files for search and theme functionality

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch CSS files
	eleventyConfig.addWatchTarget("css/**/*.css");
	// Watch images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

	// Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
	// Bundle <style> content and adds a {% css %} paired shortcode
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
		// Add all <style> content to `css` bundle (use <style eleventy:ignore> to opt-out)
		// Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
		bundleHtmlContentFromSelector: "style",
	});

	// Bundle <script> content and adds a {% js %} paired shortcode
	// Bundle <script> content and adds a {% js %} paired shortcode
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
		// Add all <script> content to the `js` bundle (use <script eleventy:ignore> to opt-out)
		// Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
		bundleHtmlContentFromSelector: "script",
	});

	// Official plugins
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 },
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 5,
			},
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "nightdogs",
			subtitle: "nightdogs",
			base: "https://nightdogs.xyz/",
			author: {
				name: "Jane Marie Bach",
			},
		},
	});

	// Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		// WebP-first optimization with AVIF for maximum compression
		formats: ["avif", "webp", "auto"],

		// Responsive widths for better performance across devices
		widths: [320, 640, 960, 1280, 1920],

		failOnError: false,

		// Skip processing images that are already in /img/imported/
		transformOnHTMLParseError: false,

		// Extended disk cache for better performance
		cacheOptions: {
			duration: "30d", // Cache for 30 days
			directory: "./.cache",
			removeUrlQueryParams: false,
		},

		htmlOptions: {
			imgAttributes: {
				// e.g. <img loading decoding> assigned on the HTML tag will override these values.
				loading: "lazy",
				decoding: "async",
				sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
			},
		},

		sharpOptions: {
			animated: false, // Disable animated processing for speed
			jpeg: {
				quality: 85,
				mozjpeg: true,
			},
			webp: {
				quality: 85,
				effort: 4,
			},
			avif: {
				quality: 80,
				effort: 4,
			},
			png: {
				quality: 90,
				compressionLevel: 9,
			},
		},

		// Add a function to skip certain images
		skipImages: (src) => {
			return (
				src.includes("/img/imported/") ||
				src.endsWith(".mp3") ||
				src.endsWith(".mp4") ||
				src.endsWith(".wav") ||
				src.endsWith(".ogg") ||
				src.endsWith(".m4a")
			);
		},
	});

	// Filters
	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addPlugin(IdAttributePlugin, {
		// by default we use Eleventy’s built-in `slugify` filter:
		// slugify: eleventyConfig.getFilter("slugify"),
		// selector: "h1,h2,h3,h4,h5,h6", // default
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return new Date().toISOString();
	});

	eleventyConfig.addFilter("contentImgUrlFilter", contentImgUrlFilter);

	// Add dateToFormat filter
	eleventyConfig.addFilter("dateToFormat", (dateObj, format) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
	});

	eleventyConfig.addFilter("unique", (arr) => Array.from(new Set(arr)));

	// Add word count filter for analytics
	eleventyConfig.addFilter("wordCount", function (content) {
		if (!content || typeof content !== "string") return 0;
		const plainText = content.replace(/<[^>]*>/g, "");
		return plainText.split(/\s+/).filter((word) => word.length > 0).length;
	});

	// Add excerpt filter for better content previews
	eleventyConfig.addFilter("excerpt", function (content, length = 160) {
		if (!content || typeof content !== "string") return "";
		const plainText = content.replace(/<[^>]*>/g, "").trim();
		if (plainText.length <= length) return plainText;

		const truncated = plainText.substring(0, length);
		const lastSpace = truncated.lastIndexOf(" ");
		return (
			(lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "..."
		);
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	// Add development server options for better performance
	eleventyConfig.setServerOptions({
		port: 8080,
		showAllHosts: true,
		// Enable hot reload for CSS and JS changes
		watch: ["css/**/*.css", "public/js/**/*.js"],
		// Show 404 page for missing pages
		showVersion: false,
	});
}

export const config = {
	// Control which files Eleventy will process
	// e.g.: *.md, *.njk, *.html, *.liquid
	templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],

	// Pre-process *.md files with: (default: `liquid`)
	markdownTemplateEngine: "njk",

	// Pre-process *.html files with: (default: `liquid`)
	htmlTemplateEngine: "njk",

	// These are all optional:
	dir: {
		input: "content", // default: "."
		includes: "../_includes", // default: "_includes" (`input` relative)
		data: "../_data", // default: "_data" (`input` relative)
		output: "_site",
	},

	// -----------------------------------------------------------------
	// Optional items:
	// -----------------------------------------------------------------

	// If your site deploys to a subdirectory, change `pathPrefix`.
	// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

	// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
	// it will transform any absolute URLs in your HTML to include this
	// folder name and does **not** affect where things go in the output folder.

	// pathPrefix: "/",
};

// Author: Seramis
// https://github.com/11ty/eleventy-img/issues/278
import path from "node:path";
import Image from "@11ty/eleventy-img";
async function contentImgUrlFilter(src) {
	const inputDir = path.dirname(this.page.inputPath);
	const imagePath = path.resolve(inputDir, src);
	const outputDir = path.dirname(this.page.outputPath);
	const urlPath = this.page.url;

	const stats = await Image(imagePath, {
		widths: [1200], // Width for Open Graph image
		formats: ["jpg", "png"],
		outputDir: outputDir, // Output directory
		urlPath: urlPath, // Public URL path
		filenameFormat: function (hash, src, width, format) {
			return `${hash}-${width}.${format}`;
		},
	});
	return stats.jpeg[0].url; // Return the URL of the processed image
}
