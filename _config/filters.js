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

	eleventyConfig.addFilter("readableDate", (dateInput, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		if (!dateInput) return "";

		try {
			let dt;

			// Handle different input types
			if (dateInput instanceof Date) {
				// JavaScript Date object
				dt = DateTime.fromJSDate(dateInput, { zone: zone || "utc" });
			} else if (typeof dateInput === "string") {
				// String input - try different parsing methods
				if (dateInput.includes("T")) {
					// ISO format string
					dt = DateTime.fromISO(dateInput, { zone: zone || "utc" });
				} else {
					// Simple date string like "2025-07-30"
					dt = DateTime.fromFormat(dateInput, "yyyy-MM-dd", {
						zone: zone || "utc",
					});
				}
			} else {
				// Try to convert to string and parse
				const dateStr = String(dateInput);
				if (dateStr.includes("T")) {
					dt = DateTime.fromISO(dateStr, { zone: zone || "utc" });
				} else {
					dt = DateTime.fromFormat(dateStr, "yyyy-MM-dd", {
						zone: zone || "utc",
					});
				}
			}

			if (!dt || !dt.isValid) {
				console.warn(
					"Invalid date input:",
					dateInput,
					"Parsed as:",
					dt?.invalidReason,
				);
				return "Invalid Date";
			}

			return dt.toFormat(format || "dd LLLL yyyy");
		} catch (error) {
			console.error("Error formatting date:", error, dateInput);
			return "Invalid Date";
		}
	});

	eleventyConfig.addFilter("htmlDateString", (dateInput) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		if (!dateInput) return "";

		try {
			let dt;

			// Handle different input types
			if (dateInput instanceof Date) {
				// JavaScript Date object
				dt = DateTime.fromJSDate(dateInput, { zone: "utc" });
			} else if (typeof dateInput === "string") {
				// String input - try different parsing methods
				if (dateInput.includes("T")) {
					// ISO format string
					dt = DateTime.fromISO(dateInput, { zone: "utc" });
				} else {
					// Simple date string like "2025-07-30"
					dt = DateTime.fromFormat(dateInput, "yyyy-MM-dd", {
						zone: "utc",
					});
				}
			} else {
				// Try to convert to string and parse
				const dateStr = String(dateInput);
				if (dateStr.includes("T")) {
					dt = DateTime.fromISO(dateStr, { zone: "utc" });
				} else {
					dt = DateTime.fromFormat(dateStr, "yyyy-MM-dd", {
						zone: "utc",
					});
				}
			}

			if (!dt || !dt.isValid) {
				console.warn(
					"Invalid date input in htmlDateString:",
					dateInput,
					"Parsed as:",
					dt?.invalidReason,
				);
				return "";
			}

			return dt.toFormat("yyyy-LL-dd");
		} catch (error) {
			console.error("Error in htmlDateString:", error, dateInput);
			return "";
		}
	});

	// Add robust CMS date parser
	eleventyConfig.addFilter("parseCMSDate", (dateInput) => {
		if (!dateInput) return null;

		try {
			let dt;

			if (dateInput instanceof Date) {
				return dateInput;
			}

			if (typeof dateInput === "string") {
				// Handle various CMS date formats
				if (dateInput.includes("T")) {
					// ISO format with timezone
					dt = DateTime.fromISO(dateInput);
					if (dt.isValid) {
						return dt.toJSDate();
					}
				}

				// Try parsing as simple date
				dt = DateTime.fromFormat(dateInput, "yyyy-MM-dd");
				if (dt.isValid) {
					return dt.toJSDate();
				}

				// Try parsing with time
				dt = DateTime.fromFormat(dateInput, "yyyy-MM-dd HH:mm:ss");
				if (dt.isValid) {
					return dt.toJSDate();
				}

				// Fallback to native Date parsing
				const nativeDate = new Date(dateInput);
				if (!isNaN(nativeDate.getTime())) {
					return nativeDate;
				}
			}

			console.warn("Could not parse CMS date:", dateInput);
			return null;
		} catch (error) {
			console.error("Error parsing CMS date:", error, dateInput);
			return null;
		}
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

	// Split string into array
	eleventyConfig.addFilter("split", (str, delimiter = " ") => {
		if (!str || typeof str !== "string") return [];
		return str.split(delimiter);
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

	// Get diverse posts for Fresh Perspectives - different authors, topics, and time periods
	eleventyConfig.addFilter(
		"diversePosts",
		(posts, currentAuthor, count = 3) => {
			if (!posts || !Array.isArray(posts)) return [];

			// Filter out current author's posts
			const otherAuthorsPosts = posts.filter(
				(post) =>
					post.data.author &&
					post.data.author !== currentAuthor &&
					post.data.title &&
					post.url,
			);

			if (otherAuthorsPosts.length === 0) return [];

			// Group posts by author
			const postsByAuthor = {};
			otherAuthorsPosts.forEach((post) => {
				const author = post.data.author;
				if (!postsByAuthor[author]) {
					postsByAuthor[author] = [];
				}
				postsByAuthor[author].push(post);
			});

			// Try to get one post from each author, prioritizing variety
			const diversePosts = [];
			const usedAuthors = new Set();
			const usedTags = new Set();

			// First pass: get one post from each author, preferring diverse tags
			Object.keys(postsByAuthor).forEach((author) => {
				if (diversePosts.length >= count) return;

				const authorPosts = postsByAuthor[author];

				// Sort by how unique their tags are
				const scoredPosts = authorPosts
					.map((post) => {
						const tags = post.data.tags || [];
						const newTags = tags.filter(
							(tag) => !usedTags.has(tag) && tag !== "posts",
						);
						return {
							post,
							uniqueTagCount: newTags.length,
							newTags,
						};
					})
					.sort((a, b) => b.uniqueTagCount - a.uniqueTagCount);

				if (scoredPosts.length > 0) {
					const selectedPost = scoredPosts[0];
					diversePosts.push(selectedPost.post);
					usedAuthors.add(author);

					// Mark these tags as used
					selectedPost.newTags.forEach((tag) => usedTags.add(tag));
				}
			});

			// Second pass: if we need more posts, get additional ones from different time periods
			if (diversePosts.length < count) {
				const remainingPosts = otherAuthorsPosts
					.filter((post) => !diversePosts.includes(post))
					.sort((a, b) => {
						// Sort by date variety - try to get posts from different months
						const aMonth = new Date(a.date).getMonth();
						const bMonth = new Date(b.date).getMonth();
						const usedMonths = diversePosts.map((p) =>
							new Date(p.date).getMonth(),
						);

						const aIsNewMonth = !usedMonths.includes(aMonth);
						const bIsNewMonth = !usedMonths.includes(bMonth);

						if (aIsNewMonth && !bIsNewMonth) return -1;
						if (!aIsNewMonth && bIsNewMonth) return 1;

						// If both or neither are new months, prefer more recent
						return new Date(b.date) - new Date(a.date);
					});

				const needed = count - diversePosts.length;
				diversePosts.push(...remainingPosts.slice(0, needed));
			}

			return diversePosts.slice(0, count);
		},
	);
}
