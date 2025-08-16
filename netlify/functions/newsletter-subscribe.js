import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
	// Only allow POST requests
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
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
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
			},
			body: "",
		};
	}

	try {
		const { email } = JSON.parse(event.body);

		// Validate email
		if (!email || !isValidEmail(email)) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Valid email address is required" }),
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

		// Add contact to Resend audience
		// Note: You'll need to create an audience in Resend dashboard first
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

		// Add contact to audience
		const contact = await resend.contacts.create({
			email: email,
			audienceId: audienceId,
			unsubscribed: false,
		});

		// Send welcome email
		await resend.emails.send({
			from: "Jane Marie Bach <newsletter@nightdogs.xyz>",
			to: email,
			subject: "🫘 Welcome to the beans",
			html: generateWelcomeEmail(email),
		});

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Successfully subscribed to newsletter",
				contactId: contact.id,
			}),
		};
	} catch (error) {
		console.error("Newsletter subscription error:", error);

		// Handle specific Resend errors
		if (error.message?.includes("already exists")) {
			return {
				statusCode: 409,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					error: "Email already subscribed to newsletter",
				}),
			};
		}

		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Failed to subscribe to newsletter" }),
		};
	}
};

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function generateWelcomeEmail(email) {
	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Nightdogs</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a2e; margin-bottom: 10px;">🫘 You're in</h1>
        <p style="color: #666; font-size: 18px;">Beans in Your Inbox</p>
      </div>

      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <p>You'll receive occasional transmissions.</p>
        <p>Sounds, signals, and other things.</p>
        <p>No spam, just beans.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://nightdogs.xyz" style="background: #ffd700; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">nightdogs.xyz</a>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>
          <a href="https://nightdogs.xyz" style="color: #1a1a2e;">Visit</a> |
          <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a>
        </p>
        <p style="margin-top: 20px;">
          Jane Marie Bach<br>
          Nightdogs
        </p>
      </div>

    </body>
    </html>
  `;
}
