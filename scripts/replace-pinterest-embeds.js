import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postPath = path.join(
	__dirname,
	"../content/blog/firstpost /firstpost.md"
);
const postDir = path.dirname(postPath);

// Regex for Pinterest and SoundCloud embeds
const PINTEREST_REGEX =
	/<a data-pin-do="embedPin" href="(https:\/\/ca\.pinterest\.com\/pin\/(\d+)\/)"><\/a>/g;
const SOUNDCLOUD_REGEX =
	/<iframe[^>]+src="https:\/\/w\.soundcloud\.com\/player\/\?url=https%3A\/\/api\.soundcloud\.com\/tracks\/(\d+)[^"]*"><\/iframe>(<div[^>]*>.*?<\/div>)?/g;

// --- Pinterest Functions ---
async function getPinImageUrl(pinId) {
	const oembedUrl = `https://www.pinterest.com/oembed.json?url=https://www.pinterest.com/pin/${pinId}/`;
	try {
		const response = await axios.get(oembedUrl);
		return response.data.thumbnail_url || null;
	} catch (error) {
		console.error(
			`Failed to fetch oEmbed data for Pinterest pin ${pinId}:`,
			error.message
		);
		return null;
	}
}

// --- SoundCloud Functions ---
async function getSoundCloudClientId() {
	try {
		const { data: pageHtml } = await axios.get("https://soundcloud.com");
		// Find all script URLs in the homepage
		const scriptUrls = pageHtml.match(/<script[^>]+src="([^"]+\.js)"/g);
		if (!scriptUrls) {
			throw new Error("Could not find any script URLs in SoundCloud homepage.");
		}

		// Search through the scripts to find the one containing the client_id
		for (const scriptTag of scriptUrls) {
			const scriptUrl = scriptTag.match(/src="([^"]+)"/)[1];
			try {
				const { data: appJs } = await axios.get(scriptUrl);
				const clientIdMatch = appJs.match(/client_id:"([a-zA-Z0-9_]+)"/);
				if (clientIdMatch && clientIdMatch[1]) {
					console.log(`Found client_id in ${scriptUrl}`);
					return clientIdMatch[1];
				}
			} catch (e) {
				// Ignore errors for scripts we can't fetch, e.g. cross-origin
				continue;
			}
		}

		throw new Error("Could not find client_id in any of the scripts.");
	} catch (error) {
		console.error("Failed to get SoundCloud client ID:", error.message);
		return null;
	}
}

async function getSoundCloudDownloadUrl(trackId, clientId) {
	const trackApiUrl = `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`;
	try {
		const { data: trackData } = await axios.get(trackApiUrl);
		if (!trackData.media || !trackData.media.transcodings) {
			throw new Error("No transcodings found for this track.");
		}
		const mp3Transcoding = trackData.media.transcodings.find(
			(t) =>
				t.format.protocol === "progressive" &&
				t.format.mime_type === "audio/mpeg"
		);
		if (!mp3Transcoding) {
			throw new Error("No progressive MP3 transcoding found.");
		}
		const { data: streamData } = await axios.get(mp3Transcoding.url, {
			params: { client_id: clientId },
		});
		return streamData.url;
	} catch (error) {
		console.error(
			`Failed to get SoundCloud download URL for track ${trackId}:`,
			error.message
		);
		return null;
	}
}

// --- Generic Download Function ---
async function downloadFile(url, filepath) {
	const response = await axios({
		url,
		method: "GET",
		responseType: "arraybuffer",
	});
	fs.writeFileSync(filepath, response.data);
}

// --- Main Execution ---
async function main() {
	let content;
	try {
		content = fs.readFileSync(postPath, "utf8");
	} catch (error) {
		console.error(`Error reading file: ${postPath}`, error);
		return;
	}

	// --- Process Pinterest Embeds ---
	const pinterestEmbeds = [...content.matchAll(PINTEREST_REGEX)];
	if (pinterestEmbeds.length > 0) {
		console.log(
			`Found ${pinterestEmbeds.length} Pinterest embeds. Processing...`
		);
		for (const embed of pinterestEmbeds) {
			const embedHtml = embed[0];
			const pinId = embed[2];
			const imageUrl = await getPinImageUrl(pinId);
			if (!imageUrl) {
				console.log(`Could not find image for pin ${pinId}. Skipping.`);
				continue;
			}
			const imageName = `pinterest-${pinId}${
				path.extname(imageUrl).split("?")[0]
			}`;
			const imagePath = path.join(postDir, imageName);
			try {
				console.log(`Downloading image for pin ${pinId}...`);
				await downloadFile(imageUrl, imagePath);
				console.log(`Saved image to ${imagePath}`);
				const imgTag = `<img src="./${imageName}" alt="Pinterest pin ${pinId}" loading="lazy">`;
				content = content.replace(embedHtml, imgTag);
			} catch (error) {
				console.error(
					`Failed to download or replace image for pin ${pinId}:`,
					error.message
				);
			}
		}
	} else {
		console.log("No Pinterest embeds found.");
	}

	// --- Process SoundCloud Embeds ---
	const soundcloudEmbeds = [...content.matchAll(SOUNDCLOUD_REGEX)];
	if (soundcloudEmbeds.length > 0) {
		console.log(
			`Found ${soundcloudEmbeds.length} SoundCloud embeds. Processing...`
		);
		const clientId = await getSoundCloudClientId();
		if (!clientId) {
			console.error(
				"Cannot proceed with SoundCloud downloads without a client_id."
			);
		} else {
			for (const embed of soundcloudEmbeds) {
				const embedHtml = embed[0];
				const trackId = embed[1];
				const downloadUrl = await getSoundCloudDownloadUrl(trackId, clientId);
				if (!downloadUrl) {
					console.log(
						`Could not get download URL for SoundCloud track ${trackId}. Skipping.`
					);
					continue;
				}
				const audioName = `soundcloud-${trackId}.mp3`;
				const audioPath = path.join(postDir, audioName);
				try {
					console.log(`Downloading audio for track ${trackId}...`);
					await downloadFile(downloadUrl, audioPath);
					console.log(`Saved audio to ${audioPath}`);
					const audioTag = `<audio controls src="./${audioName}">Your browser does not support the audio element.</audio>`;
					content = content.replace(embedHtml, audioTag);
				} catch (error) {
					console.error(
						`Failed to download or replace audio for track ${trackId}:`,
						error.message
					);
				}
			}
		}
	} else {
		console.log("No SoundCloud embeds found.");
	}

	// --- Write Updated Content ---
	try {
		fs.writeFileSync(postPath, content, "utf8");
		console.log("\nSuccessfully updated the post with local media.");
	} catch (error) {
		console.error(`Error writing updated file: ${postPath}`, error);
	}
}

main();
