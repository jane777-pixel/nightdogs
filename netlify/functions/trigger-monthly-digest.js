import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const resend = new Resend(process.env.RESEND_API_KEY);

// Manual trigger for monthly digest (for testing)
export const handler = async (event, context) => {
	console.log("🧪 Manual monthly digest trigger activated");

	try {
		// Check required environment variables
		if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
			throw new Error("Missing required environment variables");
		}

		// Parse query parameters for options
		const { test_email, force_send, include_previous_month } =
			event.queryStringParameters || {};

		console.log("📚 Collecting posts...");
		const monthlyPosts = await getMonthlyPosts(
			include_previous_month === "true",
		);

		if (monthlyPosts.length === 0) {
			console.log("📭 No posts found");
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: "No posts found for digest",
					tip: "Try adding ?include_previous_month=true to get last month's posts",
				}),
			};
		}

		console.log(`📊 Found ${monthlyPosts.length} posts`);

		// Group posts by author
		const postsByAuthor = groupPostsByAuthor(monthlyPosts);

		// Generate digest content
		const digestContent = generateDigestContent(
			postsByAuthor,
			include_previous_month === "true",
		);

		let subscribers = [];
		let emailResult = {};

		if (test_email) {
			// Send only to test email
			console.log(`📧 Sending test digest to: ${test_email}`);
			emailResult = await sendMonthlyDigest(digestContent, [test_email]);
			subscribers = [test_email];
		} else if (force_send === "true") {
			// Send to all subscribers
			console.log("👥 Fetching all newsletter subscribers...");
			subscribers = await getSubscribers();

			if (subscribers.length === 0) {
				return {
					statusCode: 200,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: "No subscribers found",
					}),
				};
			}

			console.log(`📧 Sending digest to ${subscribers.length} subscribers...`);
			emailResult = await sendMonthlyDigest(digestContent, subscribers);
		} else {
			// Preview mode - don't actually send
			console.log("👀 Preview mode - not sending emails");
		}

		console.log("✅ Manual digest trigger completed");

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Manual digest trigger completed",
				preview: !test_email && force_send !== "true",
				stats: {
					postsIncluded: monthlyPosts.length,
					authorsIncluded: Object.keys(postsByAuthor).length,
					subscribersFound: subscribers.length,
					emailsSent: emailResult.successCount || 0,
					errors: emailResult.errors || [],
				},
				digestContent: {
					subject: digestContent.subject,
					postsCount: digestContent.authorSections.reduce(
						(total, section) => total + section.posts.length,
						0,
					),
					hasFooterNote: !!digestContent.footer_note,
				},
				posts: monthlyPosts.map((post) => ({
					title: post.title,
					author: post.author,
					date: post.date.toISOString().split("T")[0],
					url: post.url,
				})),
				usage: {
					preview: "Visit this URL to preview the digest",
					testEmail: "Add ?test_email=your@email.com to send a test",
					forceSend: "Add ?force_send=true to send to all subscribers",
					previousMonth:
						"Add ?include_previous_month=true to include last month's posts",
				},
			}),
		};
	} catch (error) {
		console.error("❌ Manual digest trigger failed:", error);

		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: "Manual digest trigger failed",
				message: error.message,
			}),
		};
	}
};

// Get posts from current month (or previous month if specified)
async function getMonthlyPosts(includePreviousMonth = false) {
	const posts = [];
	const currentDate = new Date();

	let targetMonth, targetYear;
	if (includePreviousMonth) {
		const lastMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() - 1,
			1,
		);
		targetMonth = lastMonth.getMonth();
		targetYear = lastMonth.getFullYear();
	} else {
		targetMonth = currentDate.getMonth();
		targetYear = currentDate.getFullYear();
	}

	try {
		// Read actual blog posts from the filesystem
		let contentDir = path.join(process.cwd(), "content", "blog");

		// Check if content directory exists
		try {
			await fs.access(contentDir);
		} catch {
			console.log("Blog content directory not found");
			return [];
		}

		// Read all author directories
		const authorDirs = await fs.readdir(contentDir, { withFileTypes: true });

		for (const authorDir of authorDirs) {
			if (!authorDir.isDirectory()) continue;

			const authorPath = path.join(contentDir, authorDir.name);
			const yearDirs = await fs.readdir(authorPath, { withFileTypes: true });

			for (const yearDir of yearDirs) {
				if (!yearDir.isDirectory()) continue;

				const yearPath = path.join(authorPath, yearDir.name);
				const postDirs = await fs.readdir(yearPath, { withFileTypes: true });

				for (const postDir of postDirs) {
					if (!postDir.isDirectory()) continue;

					const postPath = path.join(yearPath, postDir.name);
					const indexFile = path.join(postPath, "index.md");

					try {
						const fileContent = await fs.readFile(indexFile, "utf-8");
						const parsed = matter(fileContent);
						const frontmatter = parsed.data;

						// Parse date from frontmatter
						let postDate;
						if (frontmatter.date) {
							postDate = new Date(frontmatter.date);
						} else {
							// Try to parse from directory structure
							const dateMatch = postDir.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
							if (dateMatch) {
								postDate = new Date(
									dateMatch[1],
									dateMatch[2] - 1,
									dateMatch[3],
								);
							} else {
								continue; // Skip posts without valid dates
							}
						}

						// Filter posts from target month
						if (
							postDate.getMonth() === targetMonth &&
							postDate.getFullYear() === targetYear
						) {
							// Extract content preview (first 200 characters of markdown content)
							let contentPreview = "";
							if (parsed.content) {
								contentPreview = parsed.content
									.replace(/[#*_`\[\]]/g, "") // Remove markdown syntax
									.replace(/\n\s*\n/g, " ") // Replace double newlines with space
									.replace(/\s+/g, " ") // Collapse whitespace
									.trim()
									.substring(0, 300);
								if (contentPreview.length === 300) {
									contentPreview += "...";
								}
							}

							posts.push({
								title: frontmatter.title || "Untitled",
								author: frontmatter.author || authorDir.name,
								date: postDate,
								url: `/blog/${authorDir.name}/${yearDir.name}/${postDir.name}/`,
								description:
									frontmatter.description ||
									parsed.excerpt ||
									contentPreview ||
									"Click to read this post.",
								preview: contentPreview,
								tags: frontmatter.tags || [],
								slug: postDir.name,
							});
						}
					} catch (error) {
						console.warn(`Error reading post ${indexFile}:`, error.message);
						continue;
					}
				}
			}
		}

		// Sort posts by date, newest first
		posts.sort((a, b) => b.date - a.date);

		return posts;
	} catch (error) {
		console.error("Error fetching monthly posts:", error);
		return [];
	}
}

// Group posts by author
function groupPostsByAuthor(posts) {
	const grouped = {};
	const authorNames = {
		jane: "Jane",
		orionlw: "Orion",
		adesse: "Adèsse",
		nic: "Nic",
		amelia: "Amelia",
		abby: "Abby",
		ewan: "Ewan",
	};

	posts.forEach((post) => {
		const authorKey = post.author;
		const authorName = authorNames[authorKey] || authorKey;

		if (!grouped[authorKey]) {
			grouped[authorKey] = {
				name: authorName,
				posts: [],
			};
		}

		grouped[authorKey].posts.push(post);
	});

	return grouped;
}

// Generate digest content
function generateDigestContent(postsByAuthor, includePreviousMonth = false) {
	const currentDate = new Date();
	let targetDate;

	if (includePreviousMonth) {
		targetDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() - 1,
			1,
		);
	} else {
		targetDate = currentDate;
	}

	const monthName = targetDate.toLocaleString("default", { month: "long" });
	const year = targetDate.getFullYear();

	const subject = `${monthName} ${year} Beans Digest - Monthly Roundup from nightdogs`;

	const introduction = `
		<p>Welcome to the ${monthName} ${year} edition of Beans in Your Inbox!</p>
		<p>Here's the beans in your inbox for ${monthName}:</p>
	`;

	// Generate structured content grouped by author
	const authorSections = [];
	Object.entries(postsByAuthor).forEach(([authorKey, authorData]) => {
		authorSections.push({
			authorKey,
			authorName: authorData.name,
			posts: authorData.posts.map((post) => ({
				title: post.title,
				url: `https://nightdogs.xyz${post.url}`,
				description: post.description,
				preview: post.preview,
				date: post.date,
			})),
		});
	});

	const footer_note = null; // Removed the awful footer blurb

	return {
		subject,
		introduction,
		authorSections,
		footer_note,
		sounds: null,
	};
}

// Get newsletter subscribers
async function getSubscribers() {
	try {
		const audienceId = process.env.RESEND_AUDIENCE_ID;
		const contacts = await resend.contacts.list({
			audienceId: audienceId,
		});

		return contacts.data
			.filter((contact) => !contact.unsubscribed)
			.map((contact) => contact.email);
	} catch (error) {
		console.error("Error fetching subscribers:", error);
		return [];
	}
}

// Send monthly digest
async function sendMonthlyDigest(digestContent, subscribers) {
	const batchSize = 50;
	let successCount = 0;
	const errors = [];

	// Generate HTML content
	const digestHtml = generateDigestHtml(digestContent);

	// Send in batches
	for (let i = 0; i < subscribers.length; i += batchSize) {
		const batch = subscribers.slice(i, i + batchSize);

		try {
			await resend.emails.send({
				from: "Jane Marie Bach <newsletter@nightdogs.xyz>",
				to: batch,
				subject: digestContent.subject,
				html: digestHtml,
			});

			successCount += batch.length;
			console.log(`✅ Sent batch ${Math.floor(i / batchSize) + 1}`);
		} catch (error) {
			console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
			errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
		}

		// Small delay between batches to avoid rate limits
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	return {
		successCount,
		errors,
	};
}

// Generate HTML for the digest email
function generateDigestHtml({
	subject,
	introduction,
	authorSections,
	footer_note,
}) {
	const currentDate = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	// Author theme colors
	const authorThemes = {
		jane: { background: "#ffd6e0", primary: "#b8002e", color: "#8b0020" },
		orionlw: { background: "#1a1a1a", primary: "#00ff00", color: "#ffffff" },
		adesse: { background: "#2c1810", primary: "#d4af37", color: "#f5f5dc" },
		nic: { background: "#f0f8ff", primary: "#4169e1", color: "#191970" },
		amelia: { background: "#f5f5dc", primary: "#8b4513", color: "#654321" },
		abby: { background: "#e6e6fa", primary: "#9370db", color: "#4b0082" },
		ewan: { background: "#f0fff0", primary: "#228b22", color: "#006400" },
	};

	const authorSectionsHtml = authorSections
		.map((section) => {
			const theme = authorThemes[section.authorKey] || authorThemes.jane;
			const postsHtml = section.posts
				.map(
					(post) => `
					<div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${theme.primary}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						<h4 style="margin-top: 0; color: ${theme.color}; font-size: 1.2em;">
							<a href="${post.url}" style="color: ${theme.color}; text-decoration: none;">${post.title}</a>
						</h4>
						<p style="color: #666; margin-bottom: 5px; font-size: 12px;">
							${post.date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
						</p>
						${post.preview ? `<p style="margin-bottom: 15px; line-height: 1.6; color: #333; font-size: 14px;">${post.preview}</p>` : ""}
						<a href="${post.url}" style="color: ${theme.primary}; font-weight: bold; text-decoration: none; border-bottom: 2px solid ${theme.primary}; padding-bottom: 1px;">
							Read full post →
						</a>
					</div>
				`,
				)
				.join("");

			return `
				<div style="margin-bottom: 40px;">
					<div style="background: linear-gradient(135deg, ${theme.background}, ${theme.primary}); color: ${theme.color}; padding: 20px; border-radius: 12px 12px 0 0; margin-bottom: 0;">
						<h3 style="margin: 0; font-size: 1.4em; color: ${theme.color};">
							${section.authorName}'s Posts
						</h3>
						<p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">
							${section.posts.length} post${section.posts.length !== 1 ? "s" : ""} this month
						</p>
					</div>
					<div style="border: 2px solid ${theme.primary}; border-top: none; border-radius: 0 0 12px 12px; padding: 20px; background: #fafafa;">
						${postsHtml}
					</div>
				</div>
			`;
		})
		.join("");

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
				<h1 style="margin: 0; font-size: 28px; color: #ffd700;">Monthly Nightdogs Digest</h1>
				<p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${currentDate}</p>
			</div>

			<!-- Main Content -->
			<div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background: white;">

				<!-- Introduction -->
				<div style="margin-bottom: 30px;">
					${introduction}
				</div>

				<!-- Author Sections -->
				<div style="margin-bottom: 30px;">
					<h2 style="color: #1a1a2e; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">This Month's Posts</h2>
					${authorSectionsHtml}
				</div>

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
						Visit nightdogs.xyz
					</a>
				</div>

			</div>

			<!-- Footer -->
			<div style="background: #1a1a2e; color: white; padding: 30px 20px; text-align: center;">
				<div style="margin: 20px 0;">
					<a href="https://nightdogs.xyz" style="color: #ffd700; text-decoration: none; margin: 0 15px;">nightdogs.xyz</a>
					<a href="https://nightdogs.xyz/explore/" style="color: #ffd700; text-decoration: none; margin: 0 15px;">Browse All Posts</a>
					<a href="{{unsubscribe_url}}" style="color: #ccc; text-decoration: none; margin: 0 15px;">Unsubscribe</a>
				</div>

				<p style="font-size: 14px; opacity: 0.7; margin-bottom: 0;">
					Automatically generated monthly digest<br>
					The nightdogs pack 🐕
				</p>
			</div>

		</body>
		</html>
	`;
}
