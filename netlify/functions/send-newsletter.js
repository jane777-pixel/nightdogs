// Send newsletter function for CMS-based newsletters
import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
	console.log("📧 CMS Newsletter send function activated");

	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	try {
		// Check required environment variables
		if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
			throw new Error("Missing required environment variables");
		}

		const { newsletter, testEmail, sendToAll } = JSON.parse(event.body);

		if (!newsletter) {
			throw new Error("Newsletter ID is required");
		}

		console.log(`📬 Processing newsletter: ${newsletter}`);

		// Load newsletter data from file
		const newsletterData = await loadNewsletterData(newsletter);

		if (!newsletterData) {
			throw new Error("Newsletter not found");
		}

		// Check newsletter status
		if (newsletterData.status === "sent" && !testEmail) {
			throw new Error("Newsletter has already been sent");
		}

		if (newsletterData.status === "draft") {
			throw new Error("Newsletter is still in draft status");
		}

		// Get monthly posts if auto-populate is enabled
		let monthlyPosts = [];
		if (newsletterData.autoPopulate) {
			monthlyPosts = await getMonthlyPosts(
				newsletterData.month,
				newsletterData.year,
				newsletterData.excludeAuthors || []
			);
		}

		// Combine posts
		const allPosts = combinePosts(monthlyPosts, newsletterData.featuredPosts || []);

		// Generate newsletter content
		const newsletterContent = generateNewsletterContent(newsletterData, allPosts);

		let subscribers = [];
		let emailResult = {};

		if (testEmail) {
			// Send test email
			console.log(`🧪 Sending test email to: ${testEmail}`);
			emailResult = await sendNewsletterEmails(newsletterContent, [testEmail]);
			subscribers = [testEmail];
		} else if (sendToAll) {
			// Send to all subscribers
			console.log("👥 Fetching all newsletter subscribers...");
			subscribers = await getSubscribers();

			if (subscribers.length === 0) {
				throw new Error("No subscribers found");
			}

			console.log(`📧 Sending newsletter to ${subscribers.length} subscribers...`);
			emailResult = await sendNewsletterEmails(newsletterContent, subscribers);

			// Update newsletter status to sent
			if (emailResult.successCount > 0) {
				await updateNewsletterStatus(newsletter, "sent");
			}
		} else {
			throw new Error("Either testEmail or sendToAll must be specified");
		}

		console.log("✅ Newsletter send completed");

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: testEmail ? "Test email sent successfully" : "Newsletter sent to all subscribers",
				stats: {
					subscribersFound: subscribers.length,
					emailsSent: emailResult.successCount || 0,
					errors: emailResult.errors || [],
					postsIncluded: allPosts.length,
				},
			}),
		};
	} catch (error) {
		console.error("❌ Newsletter send failed:", error);

		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: "Newsletter send failed",
				message: error.message,
			}),
		};
	}
};

// Load newsletter data from markdown file
async function loadNewsletterData(newsletterSlug) {
	try {
		const newsletterPath = path.join(process.cwd(), "content", "newsletters", `${newsletterSlug}.md`);
		const fileContent = await fs.readFile(newsletterPath, "utf-8");
		const parsed = matter(fileContent);
		return parsed.data;
	} catch (error) {
		console.error(`Error loading newsletter ${newsletterSlug}:`, error);
		return null;
	}
}

// Update newsletter status
async function updateNewsletterStatus(newsletterSlug, status) {
	try {
		const newsletterPath = path.join(process.cwd(), "content", "newsletters", `${newsletterSlug}.md`);
		const fileContent = await fs.readFile(newsletterPath, "utf-8");
		const parsed = matter(fileContent);

		// Update status
		parsed.data.status = status;

		// Add send timestamp
		if (status === "sent") {
			parsed.data.sentAt = new Date().toISOString();
		}

		// Rebuild the file
		const newContent = matter.stringify(parsed.content, parsed.data);
		await fs.writeFile(newsletterPath, newContent, "utf-8");

		console.log(`✅ Updated newsletter ${newsletterSlug} status to ${status}`);
	} catch (error) {
		console.error(`Error updating newsletter status:`, error);
	}
}

// Get posts from specified month/year
async function getMonthlyPosts(monthName, year, excludeAuthors = []) {
	const posts = [];
	const monthIndex = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	].indexOf(monthName);

	if (monthIndex === -1) return [];

	try {
		const contentDir = path.join(process.cwd(), "content", "blog");
		const authorDirs = await fs.readdir(contentDir, { withFileTypes: true });

		for (const authorDir of authorDirs) {
			if (!authorDir.isDirectory() || excludeAuthors.includes(authorDir.name)) continue;

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

						let postDate;
						if (frontmatter.date) {
							postDate = new Date(frontmatter.date);
						} else {
							const dateMatch = postDir.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
							if (dateMatch) {
								postDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
							} else {
								continue;
							}
						}

						if (postDate.getMonth() === monthIndex && postDate.getFullYear() === year) {
							let contentPreview = "";
							if (parsed.content) {
								contentPreview = parsed.content
									.replace(/[#*_`\[\]]/g, "")
									.replace(/\n\s*\n/g, " ")
									.replace(/\s+/g, " ")
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
								description: frontmatter.description || parsed.excerpt || contentPreview || "Click to read this post.",
								preview: contentPreview,
							});
						}
					} catch (error) {
						console.warn(`Error reading post ${indexFile}:`, error.message);
						continue;
					}
				}
			}
		}

		posts.sort((a, b) => b.date - a.date);
		return posts;
	} catch (error) {
		console.error("Error fetching monthly posts:", error);
		return [];
	}
}

// Combine auto-populated and featured posts
function combinePosts(monthlyPosts, featuredPosts) {
	const combined = [...monthlyPosts];

	featuredPosts.forEach(featured => {
		const exists = combined.find(post =>
			post.url === featured.url ||
			(post.title === featured.title && post.author === featured.author)
		);

		if (!exists) {
			combined.push({
				title: featured.title,
				author: featured.author,
				url: featured.url,
				description: featured.description || "Featured post",
				featured: true
			});
		}
	});

	return combined;
}

// Generate newsletter content from CMS data
function generateNewsletterContent(newsletterData, posts) {
	// Group posts by author
	const postsByAuthor = groupPostsByAuthor(posts);

	// Generate introduction with markdown processing
	const processMarkdown = (text) => {
		if (!text) return '';
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
			.replace(/\n\n/g, '</p><p>')
			.replace(/\n/g, '<br>');
	};

	const introduction = processMarkdown(newsletterData.introduction);

	// Create author sections with editorial insertions
	const authorSections = [];
	const sectionsByInsertPoint = {};

	(newsletterData.editorialSections || []).forEach(section => {
		if (!sectionsByInsertPoint[section.insertAfter]) {
			sectionsByInsertPoint[section.insertAfter] = [];
		}
		sectionsByInsertPoint[section.insertAfter].push(section);
	});

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
				featured: post.featured,
			})),
		});
	});

	const closingMessage = processMarkdown(newsletterData.closingMessage);

	return {
		subject: newsletterData.subject,
		introduction: `<p>${introduction}</p>`,
		authorSections,
		editorialSections: newsletterData.editorialSections || [],
		closingMessage: closingMessage ? `<p>${closingMessage}</p>` : null,
	};
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

// Get newsletter subscribers
async function getSubscribers() {
	try {
		const audienceId = process.env.RESEND_AUDIENCE_ID;
		const contacts = await resend.contacts.list({
			audienceId: audienceId,
		});

		// The API returns data nested under contacts.data.data
		const contactsList = contacts.data?.data || [];

		return contactsList
			.filter((contact) => !contact.unsubscribed)
			.map((contact) => contact.email);
	} catch (error) {
		console.error("Error fetching subscribers:", error);
		return [];
	}
}

// Send newsletter emails
async function sendNewsletterEmails(newsletterContent, subscribers) {
	const batchSize = 50;
	let successCount = 0;
	const errors = [];

	// Generate HTML content
	const newsletterHtml = generateNewsletterHtml(newsletterContent);

	// Send in batches
	for (let i = 0; i < subscribers.length; i += batchSize) {
		const batch = subscribers.slice(i, i + batchSize);

		try {
			await resend.emails.send({
				from: "Jane Marie Bach <newsletter@nightdogs.xyz>",
				to: batch,
				subject: newsletterContent.subject,
				html: newsletterHtml,
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

// Generate HTML for the newsletter email
function generateNewsletterHtml({
	subject,
	introduction,
	authorSections,
	editorialSections,
	closingMessage,
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

	// Create editorial sections lookup
	const sectionsByInsertPoint = {};
	editorialSections.forEach(section => {
		if (!sectionsByInsertPoint[section.insertAfter]) {
			sectionsByInsertPoint[section.insertAfter] = [];
		}
		sectionsByInsertPoint[section.insertAfter].push(section);
	});

	// Generate beginning sections
	let beginningHtml = '';
	if (sectionsByInsertPoint.beginning) {
		beginningHtml = sectionsByInsertPoint.beginning.map(section => `
			<div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
				<h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
				<div style="color: #333; line-height: 1.6;">
					${section.content}
				</div>
			</div>
		`).join('');
	}

	// Generate author sections with insertions
	const authorSectionsHtml = authorSections
		.map((section) => {
			const theme = authorThemes[section.authorKey] || authorThemes.jane;
			const postsHtml = section.posts
				.map(post => `
					<div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${theme.primary}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						<h4 style="margin-top: 0; color: ${theme.color}; font-size: 1.2em;">
							<a href="${post.url}" style="color: ${theme.color}; text-decoration: none;">${post.title}</a>
							${post.featured ? ' <span style="background: #ffd700; color: #1a1a2e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">FEATURED</span>' : ''}
						</h4>
						<p style="color: #666; margin-bottom: 5px; font-size: 12px;">
							${post.date ? post.date.toLocaleDateString("en-US", { month: "long", day: "numeric" }) : ''}
						</p>
						${post.preview ? `<p style="margin-bottom: 15px; line-height: 1.6; color: #333; font-size: 14px;">${post.preview}</p>` : ''}
						<a href="${post.url}" style="color: ${theme.primary}; font-weight: bold; text-decoration: none; border-bottom: 2px solid ${theme.primary}; padding-bottom: 1px;">
							Read full post →
						</a>
					</div>
				`)
				.join("");

			let sectionHtml = `
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

			// Add editorial sections after this author
			if (sectionsByInsertPoint[section.authorKey]) {
				sectionHtml += sectionsByInsertPoint[section.authorKey].map(section => `
					<div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
						<h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
						<div style="color: #333; line-height: 1.6;">
							${section.content}
						</div>
					</div>
				`).join('');
			}

			return sectionHtml;
		})
		.join("");

	// Generate end sections
	let endHtml = '';
	if (sectionsByInsertPoint.end) {
		endHtml = sectionsByInsertPoint.end.map(section => `
			<div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
				<h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
				<div style="color: #333; line-height: 1.6;">
					${section.content}
				</div>
			</div>
		`).join('');
	}

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
				${introduction ? `
					<div style="margin-bottom: 30px;">
						${introduction}
					</div>
				` : ''}

				<!-- Beginning Editorial Sections -->
				${beginningHtml}

				<!-- Author Sections -->
				<div style="margin-bottom: 30px;">
					<h2 style="color: #1a1a2e; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">This Month's Posts</h2>
					${authorSectionsHtml}
				</div>

				<!-- End Editorial Sections -->
				${endHtml}

				<!-- Closing Message -->
				${closingMessage ? `
					<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1a1a2e;">
						<div style="font-style: italic;">${closingMessage}</div>
					</div>
				` : ''}

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
					Monthly digest from the nightdogs pack 🐕
				</p>
			</div>

		</body>
		</html>
	`;
}
