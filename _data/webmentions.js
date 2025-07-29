import axios from "axios";
import EleventyFetch from "@11ty/eleventy-fetch";

// Removed dotenv import and config; Netlify injects env vars automatically

const API_TOKEN = process.env.WEBMENTION_IO_TOKEN;
const DOMAIN = "nightdogs.xyz";
const API_URL = `https://webmention.io/api/mentions.json?domain=${DOMAIN}&token=${API_TOKEN}`;

export default async function () {
	if (!API_TOKEN) {
		console.warn(
			"⚠️ Missing WEBMENTION_IO_TOKEN environment variable. Skipping webmention fetch."
		);
		return {
			mentions: [],
			likes: [],
			reposts: [],
			replies: [],
		};
	}

	try {
		const response = await EleventyFetch(API_URL, {
			duration: "1h",
			type: "json",
			fetchOptions: {
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			},
		});
		const mentions = response.children || [];

		const likes = mentions.filter((m) => m["wm-property"] === "like-of");
		const reposts = mentions.filter((m) => m["wm-property"] === "repost-of");
		const replies = mentions.filter(
			(m) =>
				m["wm-property"] === "in-reply-to" || m["wm-property"] === "mention-of"
		);

		const webmentions = {
			mentions,
			likes,
			reposts,
			replies,
			timestamp: new Date(),
		};

		console.log(`✅ Fetched ${mentions.length} webmentions.`);

		return webmentions;
	} catch (error) {
		console.error("❌ Error fetching webmentions:", error.message);
		return {
			mentions: [],
			likes: [],
			reposts: [],
			replies: [],
		};
	}
}
