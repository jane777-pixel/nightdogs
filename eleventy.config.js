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
import pluginRelatedPosts from "./_config/related-posts.js";
import markdownPhotos from "./_config/markdown.js";
import path from "node:path";
import Image from "@11ty/eleventy-img";

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
		// Post images are handled by the image transform below; only copy
		// audio/video files as-is.
		.addPassthroughCopy("content/**/*.{mp3,mp4,wav,ogg,m4a}");

	// The dev server skips image processing, so serve the originals instead
	if (process.env.ELEVENTY_RUN_MODE === "serve") {
		eleventyConfig.addPassthroughCopy("content/blog/**/*.{jpg,jpeg,png,gif,webp,JPG,JPEG,PNG}");
	}

	// Figures, visible captions and photo galleries in Markdown posts
	eleventyConfig.amendLibrary("md", (md) => md.use(markdownPhotos));

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
	// Skipped while running the dev server so `npm start` stays fast.
	// Generated images are cached between Netlify builds (see netlify.toml),
	// so only new photos are processed on each deploy.
	if (process.env.ELEVENTY_RUN_MODE !== "serve") {
		eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
			// WebP for modern browsers with a JPEG fallback. Images with
			// transparency skip the JPEG (see eleventy-img formatFiltering).
			formats: ["webp", "jpeg"],
			widths: [480, 960, 1600],
			// One shared folder so Netlify can cache it between builds
			urlPath: "/img/",
			outputDir: "./_site/img/",
			failOnError: false,
			transformOnHTMLParseError: false,
			cacheOptions: {
				duration: "30d",
				directory: "./.cache",
			},
			htmlOptions: {
				imgAttributes: {
					loading: "lazy",
					decoding: "async",
					// Overridden per image by _config/markdown.js
					sizes: "(max-width: 860px) 100vw, 800px",
				},
			},
			// Keep animated GIFs animated
			sharpOptions: {
				animated: true,
			},
			sharpJpegOptions: { quality: 80, mozjpeg: true, progressive: true },
			sharpWebpOptions: { quality: 78 },
		});
	}

	// Filters
	eleventyConfig.addPlugin(pluginFilters);
	eleventyConfig.addPlugin(pluginRelatedPosts);

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

// Builds a 1200px JPEG for Open Graph previews from an image path that is
// relative to the current page. See https://github.com/11ty/eleventy-img/issues/278
async function contentImgUrlFilter(src) {
	if (!src) return "";
	if (/^https?:\/\//.test(src)) return src;
	const inputDir = path.dirname(this.page.inputPath);
	const stats = await Image(path.resolve(inputDir, src), {
		widths: [1200],
		formats: ["jpeg"],
		outputDir: path.dirname(this.page.outputPath),
		urlPath: this.page.url,
		filenameFormat: (hash, src, width, format) => `${hash}-${width}.${format}`,
	});
	return stats.jpeg[0].url;
}
