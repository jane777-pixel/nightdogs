/**
 * Generate per-author RSS feeds for nightdogs.xyz
 * Creates individual feeds for each author's posts
 */

import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import authorsData from "../_data/authors.json" with { type: "json" };

export const data = {
	permalink: false, // We'll set specific permalinks for each feed
	eleventyExcludeFromCollections: true,
};

export default class AuthorFeeds {
	data() {
		return {
			pagination: {
				data: "authors",
				size: 1,
				alias: "author",
			},
			authors: Object.keys(authorsData),
			permalink: (data) => `/feed/${data.author}.xml`,
		};
	}

	async render(data) {
		const { author, collections } = data;
		const authorData = authorsData[author];

		if (!authorData) {
			console.warn(`No author data found for: ${author}`);
			return "";
		}

		// Filter posts for this specific author
		const authorPosts = collections.posts?.filter(
			post => post.data.author === author && !post.data.draft
		) || [];

		// Sort by date (newest first) and limit to 10
		const recentPosts = authorPosts
			.sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
			.slice(0, 10);

		if (recentPosts.length === 0) {
			return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>nightdogs - ${authorData.name}</title>
		<description>Posts by ${authorData.name} on nightdogs</description>
		<link>https://nightdogs.xyz/authors/${author}/</link>
		<atom:link href="https://nightdogs.xyz/feed/${author}.xml" rel="self" type="application/rss+xml"/>
		<language>en-us</language>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		<generator>Eleventy</generator>
	</channel>
</rss>`;
		}

		const latestPostDate = new Date(recentPosts[0].data.date);

		// Generate RSS XML
		const rssItems = recentPosts.map(post => {
			const title = this.escapeXml(post.data.title || "Untitled");
			const description = this.escapeXml(this.getPostExcerpt(post));
			const link = `https://nightdogs.xyz${post.url}`;
			const pubDate = new Date(post.data.date).toUTCString();
			const guid = link;

			// Get tags for categories
			const categories = (post.data.tags || [])
				.filter(tag => tag !== 'posts') // Exclude generic 'posts' tag
				.map(tag => `<category>${this.escapeXml(tag)}</category>`)
				.join('\\n\\t\\t');

			return `\t<item>
\t\t<title>${title}</title>
\t\t<description>${description}</description>
\t\t<link>${link}</link>
\t\t<guid isPermaLink="true">${guid}</guid>
\t\t<pubDate>${pubDate}</pubDate>
\t\t<author>haileebach@gmail.com (${this.escapeXml(authorData.name)})</author>
\t\t${categories}
\t</item>`;
		}).join('\\n');

		return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>nightdogs - ${this.escapeXml(authorData.name)}</title>
		<description>Posts by ${this.escapeXml(authorData.name)} on nightdogs</description>
		<link>https://nightdogs.xyz/authors/${author}/</link>
		<atom:link href="https://nightdogs.xyz/feed/${author}.xml" rel="self" type="application/rss+xml"/>
		<language>en-us</language>
		<lastBuildDate>${latestPostDate.toUTCString()}</lastBuildDate>
		<managingEditor>haileebach@gmail.com (${this.escapeXml(authorData.name)})</managingEditor>
		<webMaster>haileebach@gmail.com (nightdogs)</webMaster>
		<generator>Eleventy</generator>
		<image>
			<url>https://nightdogs.xyz/img/nightdogs-logo.png</url>
			<title>nightdogs - ${this.escapeXml(authorData.name)}</title>
			<link>https://nightdogs.xyz/authors/${author}/</link>
		</image>
${rssItems}
	</channel>
</rss>`;
	}

	// Helper method to extract post excerpt
	getPostExcerpt(post, maxLength = 300) {
		if (!post.templateContent) return "";

		// Remove HTML tags and get plain text
		const plainText = post.templateContent
			.replace(/<[^>]*>/g, "")
			.replace(/\\s+/g, " ")
			.trim();

		if (plainText.length <= maxLength) {
			return plainText;
		}

		// Truncate at word boundary
		const truncated = plainText.substring(0, maxLength);
		const lastSpace = truncated.lastIndexOf(" ");

		return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
	}

	// Helper method to escape XML content
	escapeXml(text) {
		if (typeof text !== 'string') return '';

		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
