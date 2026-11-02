// GitHub sign-in for the CMS at /admin/ (Sveltia CMS).
//
// Flow: the CMS opens a popup at /api/cms-auth, which redirects to GitHub.
// GitHub sends the user back to /api/cms-auth/callback with a code, which is
// exchanged for a token and handed to the CMS window via postMessage.
//
// Setup (once):
//   1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
//      Homepage URL:      https://nightdogs.xyz
//      Callback URL:      https://nightdogs.xyz/api/cms-auth/callback
//   2. Netlify → Site configuration → Environment variables:
//      GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

const STATE_COOKIE = "cms_auth_state";
const ALLOWED_SCOPES = new Set(["repo", "public_repo"]);

function popupResponse(origin, status, payload) {
	const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
	// Escape "<" so nothing in the payload can close the script tag
	const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
	const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body><p>Signing in… you can close this window if it stays open.</p>
<script>
(function () {
	var origin = ${json(origin)};
	var message = ${json(message)};
	function receive(event) {
		if (event.origin !== origin) return;
		window.removeEventListener("message", receive);
		window.opener.postMessage(message, origin);
		setTimeout(function () { window.close(); }, 250);
	}
	if (!window.opener) {
		document.body.textContent = "Please start signing in from the CMS at /admin/.";
		return;
	}
	window.addEventListener("message", receive);
	window.opener.postMessage("authorizing:github", origin);
})();
</script></body></html>`;
	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
			// Clear the one-time state cookie
			"Set-Cookie": `${STATE_COOKIE}=; Path=/api/cms-auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
		},
	});
}

function readCookie(req, name) {
	const header = req.headers.get("cookie") || "";
	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return rest.join("=");
	}
	return null;
}

export default async (req) => {
	const url = new URL(req.url);
	const origin = url.origin;
	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return popupResponse(origin, "error", {
			message: "Sign-in isn't set up yet: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are missing in Netlify.",
		});
	}

	const callbackUrl = `${origin}/api/cms-auth/callback`;

	// Step 1: send the user to GitHub
	if (!url.pathname.endsWith("/callback")) {
		const requestedScope = url.searchParams.get("scope");
		const scope = ALLOWED_SCOPES.has(requestedScope) ? requestedScope : "repo";
		const state = crypto.randomUUID();
		const authorize = new URL("https://github.com/login/oauth/authorize");
		authorize.searchParams.set("client_id", clientId);
		authorize.searchParams.set("redirect_uri", callbackUrl);
		authorize.searchParams.set("scope", scope);
		authorize.searchParams.set("state", state);
		return new Response(null, {
			status: 302,
			headers: {
				Location: authorize.toString(),
				"Cache-Control": "no-store",
				"Set-Cookie": `${STATE_COOKIE}=${state}; Path=/api/cms-auth; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
			},
		});
	}

	// Step 2: GitHub sent the user back
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const expectedState = readCookie(req, STATE_COOKIE);

	if (url.searchParams.get("error")) {
		return popupResponse(origin, "error", {
			message: url.searchParams.get("error_description") || "GitHub sign-in was cancelled.",
		});
	}
	if (!code || !state || !expectedState || state !== expectedState) {
		return popupResponse(origin, "error", {
			message: "Sign-in expired or was tampered with. Please try again.",
		});
	}

	try {
		const response = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: callbackUrl,
			}),
		});
		const data = await response.json();
		if (!response.ok || !data.access_token) {
			return popupResponse(origin, "error", {
				message: data.error_description || "GitHub didn't return a token.",
			});
		}
		return popupResponse(origin, "success", { token: data.access_token, provider: "github" });
	} catch (error) {
		console.error("CMS auth token exchange failed:", error.message);
		return popupResponse(origin, "error", { message: "Couldn't reach GitHub. Please try again." });
	}
};

export const config = {
	path: ["/api/cms-auth", "/api/cms-auth/callback"],
};
