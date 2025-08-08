/**
 * Related Posts System for nightdogs.xyz
 * Finds related posts based on tags, authors, and other criteria
 */

export default function relatedPostsPlugin(eleventyConfig) {
	// Main related posts filter
	eleventyConfig.addFilter(
		"relatedPosts",
		function (allPosts, currentPage, maxResults = 3) {
			const options = {
				maxResults: maxResults,
				sameAuthorWeight: 2,
				tagMatchWeight: 1,
				recencyBonus: 0.1,
				excludeDrafts: true,
			};

			if (!currentPage || !allPosts || !Array.isArray(allPosts)) return [];

			// Filter out the current post and drafts
			const candidatePosts = allPosts.filter((post) => {
				if (post.url === currentPage.url) return false;
				if (options.excludeDrafts && post.data.draft) return false;
				return true;
			});

			// Calculate relevance scores
			const scoredPosts = candidatePosts.map((post) => {
				let score = 0;

				// Same author bonus
				if (
					currentPage.data &&
					post.data.author &&
					currentPage.data.author &&
					post.data.author === currentPage.data.author
				) {
					score += options.sameAuthorWeight;
				}

				// Tag matching score
				const currentTags = new Set(
					(currentPage.data && currentPage.data.tags) || [],
				);
				const postTags = new Set(post.data.tags || []);

				// Remove common tags that don't add meaning
				const excludeTags = new Set(["posts", "blog"]);
				const meaningfulCurrentTags = new Set(
					[...currentTags].filter((tag) => !excludeTags.has(tag)),
				);
				const meaningfulPostTags = new Set(
					[...postTags].filter((tag) => !excludeTags.has(tag)),
				);

				// Calculate tag intersection
				const sharedTags = [...meaningfulCurrentTags].filter((tag) =>
					meaningfulPostTags.has(tag),
				);

				score += sharedTags.length * options.tagMatchWeight;

				// Recency bonus (newer posts get slight boost)
				const currentDate = new Date(
					(currentPage.data && currentPage.data.date) || new Date(),
				);
				const postDate = new Date(post.data.date);
				const daysDiff =
					Math.abs(currentDate - postDate) / (1000 * 60 * 60 * 24);
				const recencyScore = Math.max(
					0,
					(options.recencyBonus * (365 - daysDiff)) / 365,
				);
				score += recencyScore;

				return {
					post,
					score,
					sharedTags,
					sameAuthor:
						currentPage.data &&
						post.data.author &&
						currentPage.data.author &&
						post.data.author === currentPage.data.author,
				};
			});

			// Sort by score (descending) and return top results
			return scoredPosts
				.sort((a, b) => b.score - a.score)
				.slice(0, options.maxResults)
				.map((item) => item.post);
		},
	);

	// Get posts by same author (excluding current)
	eleventyConfig.addFilter(
		"postsBySameAuthor",
		function (currentPost, allPosts, limit = 3) {
			if (!currentPost || !allPosts) return [];

			return allPosts
				.filter((post) => {
					return (
						post.data.author === currentPost.data.author &&
						post.url !== currentPost.url &&
						!post.data.draft
					);
				})
				.sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
				.slice(0, limit);
		},
	);

	// Get posts with similar tags
	eleventyConfig.addFilter(
		"postsWithSimilarTags",
		function (currentPost, allPosts, limit = 5) {
			if (!currentPost || !allPosts) return [];

			const currentTags = new Set(currentPost.data.tags || []);
			const excludeTags = new Set(["posts", "blog"]);

			// Get meaningful tags
			const meaningfulTags = new Set(
				[...currentTags].filter((tag) => !excludeTags.has(tag)),
			);

			if (meaningfulTags.size === 0) return [];

			const taggedPosts = allPosts
				.filter((post) => {
					if (post.url === currentPost.url) return false;
					if (post.data.draft) return false;

					const postTags = new Set(post.data.tags || []);
					const postMeaningfulTags = new Set(
						[...postTags].filter((tag) => !excludeTags.has(tag)),
					);

					// Check for any shared meaningful tags
					return [...meaningfulTags].some((tag) => postMeaningfulTags.has(tag));
				})
				.map((post) => {
					const postTags = new Set(post.data.tags || []);
					const postMeaningfulTags = new Set(
						[...postTags].filter((tag) => !excludeTags.has(tag)),
					);
					const sharedTags = [...meaningfulTags].filter((tag) =>
						postMeaningfulTags.has(tag),
					);

					return {
						post,
						sharedTagCount: sharedTags.length,
						sharedTags,
					};
				})
				.sort((a, b) => {
					// Sort by shared tag count, then by date
					if (b.sharedTagCount !== a.sharedTagCount) {
						return b.sharedTagCount - a.sharedTagCount;
					}
					return new Date(b.post.data.date) - new Date(a.post.data.date);
				})
				.slice(0, limit)
				.map((item) => item.post);

			return taggedPosts;
		},
	);

	// Get recent posts from all authors
	eleventyConfig.addFilter(
		"recentPosts",
		function (allPosts, excludePost = null, limit = 5) {
			if (!allPosts) return [];

			return allPosts
				.filter((post) => {
					if (excludePost && post.url === excludePost.url) return false;
					if (post.data.draft) return false;
					return true;
				})
				.sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
				.slice(0, limit);
		},
	);

	// Get tag relevance score
	eleventyConfig.addFilter("tagRelevance", function (currentPost, targetPost) {
		if (!currentPost || !targetPost) return 0;

		const currentTags = new Set(currentPost.data.tags || []);
		const targetTags = new Set(targetPost.data.tags || []);
		const excludeTags = new Set(["posts", "blog"]);

		const meaningfulCurrentTags = new Set(
			[...currentTags].filter((tag) => !excludeTags.has(tag)),
		);
		const meaningfulTargetTags = new Set(
			[...targetTags].filter((tag) => !excludeTags.has(tag)),
		);

		const sharedTags = [...meaningfulCurrentTags].filter((tag) =>
			meaningfulTargetTags.has(tag),
		);

		if (meaningfulCurrentTags.size === 0) return 0;

		return (sharedTags.length / meaningfulCurrentTags.size) * 100;
	});

	// Shortcode for related posts section
	eleventyConfig.addShortcode(
		"relatedPostsSection",
		function (currentPost, allPosts) {
			const relatedPosts = this.ctx.collections.posts
				? this.getFilteredByGlob(
						this.ctx.collections.posts,
						"relatedPosts",
						currentPost,
						{ maxResults: 3 },
					)
				: [];

			if (relatedPosts.length === 0) return "";

			let html = `<section class="related-posts">
			<h3>Related Posts</h3>
			<ul class="related-posts-list">`;

			relatedPosts.forEach((post) => {
				const author = post.data.author || "unknown";
				const title = post.data.title || "Untitled";
				const date = new Date(post.data.date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});

				html += `
				<li class="related-post" data-author="${author}">
					<article>
						<h4><a href="${post.url}">${title}</a></h4>
						<div class="post-meta">
							<span class="author">by ${author}</span>
							<span class="date">${date}</span>
						</div>
					</article>
				</li>`;
			});

			html += `</ul></section>`;
			return html;
		},
	);

	// Get trending tags (tags that appear frequently in recent posts)
	eleventyConfig.addFilter(
		"trendingTags",
		function (allPosts, daysBack = 30, limit = 10) {
			if (!allPosts) return [];

			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysBack);

			const tagCounts = {};
			const excludeTags = new Set(["posts", "blog"]);

			allPosts
				.filter((post) => {
					const postDate = new Date(post.data.date);
					return postDate >= cutoffDate && !post.data.draft;
				})
				.forEach((post) => {
					const tags = post.data.tags || [];
					tags.forEach((tag) => {
						if (!excludeTags.has(tag)) {
							tagCounts[tag] = (tagCounts[tag] || 0) + 1;
						}
					});
				});

			return Object.entries(tagCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, limit)
				.map(([tag, count]) => ({ tag, count }));
		},
	);

	// Get author activity (posts per author in recent period)
	eleventyConfig.addFilter(
		"authorActivity",
		function (allPosts, daysBack = 30) {
			if (!allPosts) return [];

			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysBack);

			const authorCounts = {};

			allPosts
				.filter((post) => {
					const postDate = new Date(post.data.date);
					return postDate >= cutoffDate && !post.data.draft;
				})
				.forEach((post) => {
					const author = post.data.author || "unknown";
					authorCounts[author] = (authorCounts[author] || 0) + 1;
				});

			return Object.entries(authorCounts)
				.sort(([, a], [, b]) => b - a)
				.map(([author, count]) => ({ author, count }));
		},
	);
}

// Helper function to calculate post similarity
export function calculatePostSimilarity(post1, post2, options = {}) {
	const { tagWeight = 1, authorWeight = 2, dateWeight = 0.1 } = options;

	let similarity = 0;

	// Same author bonus
	if (post1.data.author === post2.data.author) {
		similarity += authorWeight;
	}

	// Tag similarity
	const tags1 = new Set(post1.data.tags || []);
	const tags2 = new Set(post2.data.tags || []);
	const excludeTags = new Set(["posts", "blog"]);

	const meaningfulTags1 = new Set(
		[...tags1].filter((tag) => !excludeTags.has(tag)),
	);
	const meaningfulTags2 = new Set(
		[...tags2].filter((tag) => !excludeTags.has(tag)),
	);

	const sharedTags = [...meaningfulTags1].filter((tag) =>
		meaningfulTags2.has(tag),
	);
	const totalUniqueTags = new Set([...meaningfulTags1, ...meaningfulTags2])
		.size;

	if (totalUniqueTags > 0) {
		similarity += (sharedTags.length / totalUniqueTags) * tagWeight;
	}

	// Date proximity (posts published closer together are slightly more related)
	const date1 = new Date(post1.data.date);
	const date2 = new Date(post2.data.date);
	const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
	const dateProximity = Math.max(0, (365 - daysDiff) / 365);
	similarity += dateProximity * dateWeight;

	return similarity;
}
