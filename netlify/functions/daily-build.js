// Daily rebuild so webmentions stay fresh.
// Needs NETLIFY_BUILD_HOOK_URL (Site settings → Build & deploy → Build hooks).
export default async () => {
	const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
	if (!buildHookUrl) {
		console.error("NETLIFY_BUILD_HOOK_URL is not set; skipping daily build");
		return new Response("Build hook not configured", { status: 500 });
	}

	const response = await fetch(`${buildHookUrl}?trigger_title=${encodeURIComponent("Daily webmentions refresh")}`, {
		method: "POST",
	});

	if (!response.ok) {
		console.error(`Build hook failed: ${response.status}`);
		return new Response("Build hook failed", { status: 502 });
	}

	console.log("Daily build triggered");
	return new Response("Build triggered", { status: 200 });
};

// Every day at 02:00 UTC
export const config = { schedule: "0 2 * * *" };
