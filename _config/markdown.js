// Markdown tweaks for photo posts.
//
// - A paragraph that contains only images becomes one or more <figure>s.
//   The image title ("caption" in the CMS) becomes a visible <figcaption>
//   instead of a hover-only tooltip.
// - Runs of consecutive image-only paragraphs are wrapped in
//   <div class="gallery">. Posts with `photoLayout: grid` in their front
//   matter get a thumbnail grid; others keep a single column.
// - Each image gets a `sizes` hint that matches the layout, so browsers
//   download an appropriately sized file.

const SIZES = {
	column: "(max-width: 860px) 100vw, 800px",
	grid: "(max-width: 560px) 50vw, (max-width: 860px) 33vw, 300px",
};

function isWhitespace(token) {
	return (
		token.type === "softbreak" ||
		token.type === "hardbreak" ||
		(token.type === "text" && token.content.trim() === "")
	);
}

function imageOnly(inline) {
	const children = inline?.children ?? [];
	const images = children.filter((t) => t.type === "image");
	return images.length > 0 && children.every((t) => t.type === "image" || isWhitespace(t));
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export default function markdownPhotos(md) {
	// Group image-only paragraphs into galleries of figures.
	md.core.ruler.push("photo_galleries", (state) => {
		const layout = state.env?.photoLayout === "grid" ? "grid" : "column";
		const src = state.tokens;
		const out = [];
		let inGallery = false;
		let count = 0;
		let openToken = null;

		const html = (content) => {
			const t = new state.Token("html_block", "", 0);
			t.content = content;
			return t;
		};

		const closeGallery = () => {
			if (!inGallery) return;
			out.push(html("</div>\n"));
			openToken.content = `<div class="gallery gallery--${layout}" data-count="${count}">\n`;
			inGallery = false;
		};

		for (let i = 0; i < src.length; i++) {
			const token = src[i];
			const inline = src[i + 1];
			if (token.type === "paragraph_open" && token.level === 0 && imageOnly(inline)) {
				if (!inGallery) {
					openToken = html("");
					out.push(openToken);
					inGallery = true;
					count = 0;
				}
				for (const child of inline.children) {
					if (child.type !== "image") continue;
					child.meta = { ...(child.meta || {}), figure: true, layout };
					const fig = new state.Token("inline", "", 0);
					fig.children = [child];
					fig.content = "";
					out.push(fig);
					count++;
				}
				i += 2; // skip inline + paragraph_close
				continue;
			}
			closeGallery();
			out.push(token);
		}
		closeGallery();
		state.tokens = out;
	});

	const defaultImage =
		md.renderer.rules.image ||
		((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

	md.renderer.rules.image = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		const layout = token.meta?.layout || (env?.photoLayout === "grid" ? "grid" : "column");
		if (!token.attrGet("sizes")) token.attrSet("sizes", SIZES[layout]);

		if (!token.meta?.figure) {
			return defaultImage(tokens, idx, options, env, self);
		}

		const caption = token.attrGet("title");
		if (caption) {
			// The caption is shown visibly, so drop the duplicate tooltip.
			token.attrs = token.attrs.filter(([name]) => name !== "title");
		}
		const img = defaultImage(tokens, idx, options, env, self);
		const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
		return `<figure class="photo">${img}${figcaption}</figure>\n`;
	};
}
