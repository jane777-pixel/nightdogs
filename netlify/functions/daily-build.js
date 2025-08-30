// Daily build trigger for webmentions refresh
export const handler = async (event, context) => {
	console.log("🔄 Daily build trigger started for webmentions refresh");

	try {
		// Check if build hook URL is configured
		const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;

		if (!buildHookUrl) {
			console.error("❌ NETLIFY_BUILD_HOOK_URL environment variable not configured");
			return {
				statusCode: 500,
				body: JSON.stringify({
					error: "Build hook URL not configured",
					message: "Please set NETLIFY_BUILD_HOOK_URL environment variable",
				}),
			};
		}

		console.log("📡 Triggering site rebuild for webmentions...");

		// Trigger the build using Netlify's build hook
		const response = await fetch(buildHookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				trigger_branch: "main",
				trigger_title: "Daily webmentions refresh",
			}),
		});

		if (!response.ok) {
			throw new Error(`Build hook request failed with status: ${response.status}`);
		}

		const buildData = await response.json();
		console.log("✅ Build triggered successfully:", buildData);

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Daily build triggered successfully",
				buildId: buildData.id,
				buildUrl: buildData.url,
				timestamp: new Date().toISOString(),
				reason: "Daily webmentions refresh",
			}),
		};
	} catch (error) {
		console.error("❌ Daily build trigger failed:", error);

		return {
			statusCode: 500,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: "Daily build trigger failed",
				message: error.message,
				timestamp: new Date().toISOString(),
			}),
		};
	}
};
