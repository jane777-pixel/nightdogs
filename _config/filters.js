import { DateTime } from "luxon";

export default function (eleventyConfig) {
	// Reading time estimation filter
	eleventyConfig.addFilter("readingTime", function (content) {
		if (!content || typeof content !== "string") {
			return "0 min read";
		}

		// Strip HTML tags and get plain text
		const plainText = content.replace(/<[^>]*>/g, "");

		// Count words (split by whitespace and filter empty strings)
		const words = plainText.split(/\s+/).filter((word) => word.length > 0);
		const wordCount = words.length;

		// Calculate reading time (assuming 200 words per minute)
		const wordsPerMinute = 200;
		const minutes = Math.ceil(wordCount / wordsPerMinute);

		// Format the output
		if (minutes === 1) {
			return "1 min read";
		} else if (minutes < 60) {
			return `${minutes} min read`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			if (remainingMinutes === 0) {
				return `${hours}h read`;
			} else {
				return `${hours}h ${remainingMinutes}m read`;
			}
		}
	});

	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
			format || "dd LLLL yyyy",
		);
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
	});

	eleventyConfig.addFilter("dateToIso", (dateObj) => {
		// Convert date to ISO 8601 format for structured data and meta tags
		if (!dateObj) return "";
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISO();
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", (target) => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter((tag) => ["all", "posts"].indexOf(tag) === -1);
	});

	eleventyConfig.addFilter("sortAlphabetically", (strings) =>
		(strings || []).sort((b, a) => b.localeCompare(a)),
	);

	// Webmentions
	eleventyConfig.addFilter("mentionsForUrl", (mentions, url) => {
		const normalize = (u) =>
			decodeURIComponent(u || "")
				.replace(/^https?:\/\/(www\.)?nightdogs\.xyz/, "") // strip domain if present
				.replace(/\/+$/, "") // remove trailing slash(es)
				.replace(/\/index$/, ""); // treat /foo/ and /foo/index as same
		const normUrl = normalize(url);
		console.log("Webmentions DEBUG: normUrl =", normUrl);
		return mentions.filter((m) => {
			if (!m.target) return false;
			const targetNorm = normalize(m.target);
			console.log("Webmentions DEBUG: comparing", targetNorm, "vs", normUrl);
			return (
				targetNorm === normUrl ||
				targetNorm === normUrl.replace(/\/$/, "") ||
				targetNorm + "/" === normUrl
			);
		});
	});

	eleventyConfig.addFilter("mentionType", (mentions, type) => {
		if (!mentions || !type) return [];
		return mentions.filter((mention) => mention["wm-property"] === type);
	});

	eleventyConfig.addFilter("rfc822", (dateObj) => {
		return new Date(dateObj).toUTCString();
	});

	eleventyConfig.addFilter("date", (dateObj, format = "yyyy") => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
	});

	// Convert ISO date string to JavaScript Date object for webmentions
	eleventyConfig.addFilter("dateObject", (dateString) => {
		if (!dateString) return null;
		if (typeof dateString !== "string") return dateString; // Already a Date object
		try {
			const date = new Date(dateString);
			return isNaN(date.getTime()) ? null : date;
		} catch (e) {
			return null;
		}
	});

	// Filter posts by author
	eleventyConfig.addFilter("filterByAuthor", (posts, authorSlug) => {
		if (!posts || !authorSlug) return [];
		return posts.filter((post) => post.data.author === authorSlug);
	});

	// Calculate total word count for an array of posts
	eleventyConfig.addFilter("totalWordCount", (posts) => {
		if (!posts || !Array.isArray(posts)) return 0;
		return posts.reduce((total, post) => {
			if (post.data.readingTime && post.data.readingTime.words) {
				return total + post.data.readingTime.words;
			}
			// Fallback: estimate from content safely
			try {
				const content = post.content || "";
				if (content) {
					const plainText = content.replace(/<[^>]*>/g, "");
					const words = plainText
						.split(/\s+/)
						.filter((word) => word.length > 0);
					return total + words.length;
				}
			} catch (e) {
				// If content isn't available, skip this post
				console.warn(
					"Could not access content for word count:",
					post.inputPath,
				);
			}
			return total;
		}, 0);
	});

	// Format numbers with commas
	eleventyConfig.addFilter("numberFormat", (num) => {
		if (typeof num !== "number") return num;
		return num.toLocaleString();
	});

	// Get first character
	eleventyConfig.addFilter("first", (str) => {
		if (!str) return "";
		return str.toString().charAt(0);
	});

	// ISO date format
	eleventyConfig.addFilter("isoDate", (dateObj) => {
		if (!dateObj) return "";
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
	});

	// Strip HTML tags from content
	eleventyConfig.addFilter("striptags", (content) => {
		if (!content || typeof content !== "string") return "";
		return content.replace(/<[^>]*>/g, "");
	});

	// Truncate text to specified length
	eleventyConfig.addFilter("truncate", (text, length = 100) => {
		if (!text || typeof text !== "string") return "";
		if (text.length <= length) return text;
		return text.substring(0, length).trim() + "...";
	});

	// Filter posts by tag
	eleventyConfig.addFilter("filterByTag", (posts, tag) => {
		if (!posts || !tag) return [];
		return posts.filter((post) => {
			const tags = post.data.tags || [];
			return tags.includes(tag);
		});
	});

	// Get unique authors from a list of posts
	eleventyConfig.addFilter("getUniqueAuthors", (posts) => {
		if (!posts || !Array.isArray(posts)) return [];
		const authors = new Set();
		posts.forEach((post) => {
			if (post.data.author) {
				authors.add(post.data.author);
			}
		});
		return Array.from(authors).sort();
	});

	// Get tags that often appear together with the current tag
	eleventyConfig.addFilter("getRelatedTags", (posts, currentTag, limit = 6) => {
		if (!posts || !currentTag) return [];

		const tagCooccurrence = {};
		const excludeTags = new Set(["posts", "blog", "all", currentTag]);

		// Count tag co-occurrences
		posts.forEach((post) => {
			const tags = (post.data.tags || []).filter(
				(tag) => !excludeTags.has(tag),
			);
			if (tags.includes(currentTag)) {
				tags.forEach((tag) => {
					if (tag !== currentTag) {
						tagCooccurrence[tag] = (tagCooccurrence[tag] || 0) + 1;
					}
				});
			}
		});

		// Sort by frequency and return top results
		return Object.entries(tagCooccurrence)
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, limit);
	});

	// Get all unique tags from blog posts
	eleventyConfig.addFilter("getAllTags", (posts) => {
		if (!posts || !Array.isArray(posts)) return [];
		const allTags = new Set();
		const excludeTags = new Set(["posts", "blog", "all"]);

		posts.forEach((post) => {
			const tags = post.data.tags || [];
			tags.forEach((tag) => {
				if (!excludeTags.has(tag)) {
					allTags.add(tag);
				}
			});
		});

		return Array.from(allTags).sort();
	});

	// Get tag statistics with counts
	eleventyConfig.addFilter("getTagStats", (tags) => {
		if (!tags || !Array.isArray(tags)) return [];

		const tagCounts = {};
		const excludeTags = new Set(["posts", "blog", "all"]);

		// Get all blog posts
		const blogPosts = tags; // This will be blog posts when called from template

		// Count tag occurrences
		if (Array.isArray(blogPosts)) {
			blogPosts.forEach((post) => {
				const postTags = post.data?.tags || [];
				postTags.forEach((tag) => {
					if (!excludeTags.has(tag)) {
						tagCounts[tag] = (tagCounts[tag] || 0) + 1;
					}
				});
			});
		}

		// Convert to array and sort by count
		return Object.entries(tagCounts)
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => b.count - a.count);
	});

	// Get the most used tag
	eleventyConfig.addFilter("mostUsedTag", (tagStats) => {
		if (!tagStats || !Array.isArray(tagStats) || tagStats.length === 0) {
			return { tag: "", count: 0 };
		}
		return tagStats[0];
	});

	// Get CSS size class for tag cloud based on frequency
	eleventyConfig.addFilter("getTagSizeClass", (tagInfo) => {
		if (!tagInfo || !tagInfo.count) return "size-xs";

		const count = tagInfo.count;
		if (count >= 10) return "size-xl";
		if (count >= 7) return "size-lg";
		if (count >= 4) return "size-md";
		if (count >= 2) return "size-sm";
		return "size-xs";
	});

	// Reject items that match a property value
	eleventyConfig.addFilter("reject", (array, property, value) => {
		if (!array || !Array.isArray(array)) return [];
		return array.filter((item) => {
			if (property.includes(".")) {
				// Handle nested properties like "data.author"
				const props = property.split(".");
				let obj = item;
				for (const prop of props) {
					obj = obj?.[prop];
				}
				return obj !== value;
			}
			return item[property] !== value;
		});
	});

	// Get random sample from array
	eleventyConfig.addFilter("randomSample", (array, count = 3) => {
		if (!array || !Array.isArray(array)) return [];
		if (array.length <= count) return array;

		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled.slice(0, count);
	});
}
