import { DateTime } from "luxon";

export default function (eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
			format || "dd LLLL yyyy"
		);
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
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
		(strings || []).sort((b, a) => b.localeCompare(a))
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
}
