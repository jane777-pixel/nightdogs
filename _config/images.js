// Helpers for finding and preparing a post's photos outside the post body:
// thumbnails on listing pages and the preview image used when sharing links.
import fs from "node:fs";
import path from "node:path";
import Image from "@11ty/eleventy-img";

const CONTENT_DIR = "content";
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)"]+?)>?(?:\s+"[^"]*")?\s*\)/;
const HTML_IMAGE = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/i;
const cache = new Map();

function isLocal(src) {
	return src && !/^(https?:)?\/\//.test(src) && !src.startsWith("data:");
}

// Returns { src, alt } for the first local image in a post, with `src` as an
// absolute path from the content folder (e.g. /blog/jane/.../photo.jpg), which
// the image transform knows how to find. Returns null if there is none.
export function firstImage(inputPath, explicit) {
	if (!inputPath) return null;
	const key = `${inputPath}|${explicit || ""}`;
	if (cache.has(key)) return cache.get(key);

	let found = null;
	if (isLocal(explicit)) {
		found = { src: explicit, alt: "" };
	} else {
		let raw = "";
		try {
			raw = fs.readFileSync(inputPath, "utf8");
		} catch {
			/* ignore */
		}
		const body = raw.replace(/^---[\s\S]*?\n---/, "");
		const candidates = [];
		const md = body.match(new RegExp(MARKDOWN_IMAGE, "g")) || [];
		for (const m of md) {
			const [, alt, src] = m.match(MARKDOWN_IMAGE);
			candidates.push({ index: body.indexOf(m), src: src.trim(), alt });
		}
		const html = body.match(new RegExp(HTML_IMAGE, "gi")) || [];
		for (const m of html) {
			const src = m.match(HTML_IMAGE)[1];
			const alt = (m.match(/\balt="([^"]*)"/i) || [])[1] || "";
			candidates.push({ index: body.indexOf(m), src, alt });
		}
		candidates.sort((a, b) => a.index - b.index);
		found = candidates.find((c) => isLocal(c.src)) || null;
	}

	if (found) {
		const decoded = decodeURI(found.src);
		const absolute = decoded.startsWith("/")
			? path.join(CONTENT_DIR, decoded)
			: path.join(path.dirname(inputPath), decoded);
		if (fs.existsSync(absolute)) {
			const fromContent = path.relative(CONTENT_DIR, absolute).split(path.sep).join("/");
			found = { src: encodeURI("/" + fromContent), alt: found.alt, file: absolute };
		} else {
			found = null;
		}
	}
	cache.set(key, found);
	return found;
}

export default function (eleventyConfig) {
	// {% set img = post.inputPath | firstImage %} → { src, alt } or null
	eleventyConfig.addFilter("firstImage", (inputPath, explicit) => firstImage(inputPath, explicit));

	// 1200px JPEG for link previews (Open Graph). Returns a site-relative URL.
	eleventyConfig.addFilter("socialImage", async (inputPath, explicit) => {
		const image = firstImage(inputPath, explicit);
		if (!image) return "";
		try {
			const stats = await Image(image.file, {
				widths: [1200],
				formats: ["jpeg"],
				outputDir: "./_site/img/social/",
				urlPath: "/img/social/",
				sharpJpegOptions: { quality: 80, mozjpeg: true },
			});
			return stats.jpeg[0].url;
		} catch (error) {
			console.warn(`[socialImage] ${image.file}: ${error.message}`);
			return "";
		}
	});
}
