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
		const { email, contactId } = JSON.parse(event.body);

		// Validate inputs
		if (!email && !contactId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Email or contact ID is required" }),
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

		// If we have contactId, use it directly. Otherwise, find contact by email
		let targetContactId = contactId;

		if (!targetContactId && email) {
			// Find contact by email
			try {
				const contacts = await resend.contacts.list({
					audienceId: audienceId,
				});

				const contact = contacts.data.find((c) => c.email === email);
				if (contact) {
					targetContactId = contact.id;
				}
			} catch (error) {
				console.error("Error finding contact:", error);
			}
		}

		if (!targetContactId) {
			return {
				statusCode: 404,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ error: "Contact not found" }),
			};
		}

		// Remove contact from audience
		await resend.contacts.remove({
			audienceId: audienceId,
			id: targetContactId,
		});

		// Send goodbye email (optional)
		if (email) {
			try {
				await resend.emails.send({
					from: "Jane Marie Bach <newsletter@nightdogs.xyz>",
					to: email,
					subject: "🫘 Until next time",
					html: generateGoodbyeEmail(email),
				});
			} catch (emailError) {
				console.error("Error sending goodbye email:", emailError);
				// Don't fail the unsubscribe if email fails
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
				message: "Successfully unsubscribed from newsletter",
			}),
		};
	} catch (error) {
		console.error("Newsletter unsubscribe error:", error);

		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Failed to unsubscribe from newsletter" }),
		};
	}
};

function generateGoodbyeEmail(email) {
	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Goodbye from Nightdogs</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a2e; margin-bottom: 10px;">🫘 You're out</h1>
        <p style="color: #666; font-size: 18px;">No more beans</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <p>You've been unsubscribed.</p>
        <p>The transmissions have stopped.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://nightdogs.xyz" style="background: #ffd700; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">nightdogs.xyz</a>
        <a href="https://nightdogs.xyz/#newsletter-signup" style="background: transparent; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; border: 2px solid #1a1a2e;">Resubscribe</a>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>
          <a href="https://nightdogs.xyz" style="color: #1a1a2e;">Visit</a>
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
