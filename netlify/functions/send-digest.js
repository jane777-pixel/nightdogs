import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
	// Only allow POST requests
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
			},
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	// Handle CORS preflight
	if (event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
			},
			body: "",
		};
	}

	try {
		// Netlify Identity authentication
		const authHeader = event.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return {
				statusCode: 401,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "No authorization token provided" }),
			};
		}

		// Extract the JWT token
		const token = authHeader.replace("Bearer ", "");

		// Verify the token with Netlify Identity
		try {
			const response = await fetch(
				`${process.env.URL}/.netlify/identity/user`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				return {
					statusCode: 401,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ error: "Invalid token" }),
				};
			}

			const user = await response.json();
			console.log("Authenticated user:", user.email);
		} catch (authError) {
			console.error("Authentication error:", authError);
			return {
				statusCode: 401,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Authentication failed" }),
			};
		}

		const { subject, introduction, articles, sounds, footer_note, test_email } =
			JSON.parse(event.body);

		// Validate required fields
		if (!subject || !introduction || !articles || !Array.isArray(articles)) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					error: "Missing required fields: subject, introduction, articles",
				}),
			};
		}

		// Check if RESEND_API_KEY is configured
		if (!process.env.RESEND_API_KEY) {
			console.error("RESEND_API_KEY environment variable is not set");
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Newsletter service not configured" }),
			};
		}

		const audienceId = process.env.RESEND_AUDIENCE_ID;

		if (!audienceId) {
			console.error("RESEND_AUDIENCE_ID environment variable is not set");
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Newsletter audience not configured" }),
			};
		}

		// If test_email is provided, send only to that email
		let recipients = [];
		if (test_email) {
			recipients = [test_email];
		} else {
			// Get all contacts from audience
			const contacts = await resend.contacts.list({
				audienceId: audienceId,
			});
			recipients = contacts.data.map((contact) => contact.email);
		}

		if (recipients.length === 0) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "No recipients found" }),
			};
		}

		// Generate digest email HTML
		const digestHtml = generateDigestEmail({
			subject,
			introduction,
			articles,
			sounds,
			footer_note,
		});

		// Send emails in batches to avoid rate limits
		const batchSize = 50;
		const batches = [];
		for (let i = 0; i < recipients.length; i += batchSize) {
			batches.push(recipients.slice(i, i + batchSize));
		}

		let totalSent = 0;
		let errors = [];

		for (const batch of batches) {
			try {
				await resend.emails.send({
					from: "Jane Marie Bach <newsletter@nightdogs.xyz>",
					to: batch,
					subject: subject,
					html: digestHtml,
				});
				totalSent += batch.length;
			} catch (error) {
				console.error("Batch send error:", error);
				errors.push(
					`Failed to send to batch of ${batch.length} recipients: ${error.message}`,
				);
			}
		}

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: `Digest sent successfully`,
				stats: {
					totalRecipients: recipients.length,
					totalSent: totalSent,
					errors: errors.length > 0 ? errors : null,
				},
			}),
		};
	} catch (error) {
		console.error("Send digest error:", error);

		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Failed to send digest newsletter" }),
		};
	}
};

function generateDigestEmail({
	subject,
	introduction,
	articles,
	sounds,
	footer_note,
}) {
	const currentDate = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const articlesHtml = articles
		.map(
			(article) => `
    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #ffd700;">
      <h3 style="margin-top: 0; color: #1a1a2e;">
        <a href="${article.url}" style="color: #1a1a2e; text-decoration: none;">${article.title}</a>
      </h3>
      <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
        ${article.source ? `${article.source}` : ""}
      </p>
      <p style="margin-bottom: 15px; line-height: 1.6;">${article.description}</p>
      <a href="${article.url}" style="color: #1a1a2e; font-weight: bold; text-decoration: none; border-bottom: 2px solid #ffd700;">
        →
      </a>
    </div>
  `,
		)
		.join("");

	const soundsHtml = sounds
		? `
    <div style="background: linear-gradient(135deg, #ffd700, #ffed4e); padding: 25px; border-radius: 12px; margin: 30px 0; color: #1a1a2e;">
      <h2 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
        🎵 Sound Transmission
      </h2>
      <h3 style="margin: 10px 0;">${sounds.title}</h3>
      <p style="margin-bottom: 15px; font-style: italic;">${sounds.description}</p>

      ${
				sounds.url
					? `
        <a href="${sounds.url}" style="background: #1a1a2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Listen →
        </a>
      `
					: ""
			}
    </div>
  `
		: "";

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: #ffd700;">🫘 Beans in Your Inbox</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${currentDate}</p>
      </div>

      <!-- Main Content -->
      <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background: white;">

        <!-- Introduction -->
        <div style="margin-bottom: 30px;">
          <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px;">${introduction}</p>
        </div>

        <!-- Articles Section -->
        <div style="margin-bottom: 30px;">
          ${articlesHtml}
        </div>

        <!-- Sounds Section -->
        ${soundsHtml}

        <!-- Footer Note -->
        ${
					footer_note
						? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1a1a2e;">
            <p style="margin-bottom: 0; font-style: italic;">${footer_note}</p>
          </div>
        `
						: ""
				}

        <!-- Call to Action -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://nightdogs.xyz" style="background: #ffd700; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
            nightdogs.xyz
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #1a1a2e; color: white; padding: 30px 20px; text-align: center;">
        <div style="margin: 20px 0;">
          <a href="https://nightdogs.xyz" style="color: #ffd700; text-decoration: none; margin: 0 15px;">nightdogs.xyz</a>
          <a href="{{unsubscribe_url}}" style="color: #ccc; text-decoration: none; margin: 0 15px;">Unsubscribe</a>
        </div>

        <p style="font-size: 14px; opacity: 0.7; margin-bottom: 0;">
          Nightdogs
        </p>
      </div>

    </body>
    </html>
  `;
}
