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

	// Cross-author recommendations: Find posts from OTHER authors with similar content
	eleventyConfig.addFilter(
		"crossAuthorRecommendations",
		function (allPosts, currentPost, limit = 4) {
			try {
				if (!currentPost || !allPosts) return [];

				// Follow same pattern as main relatedPosts filter
				const currentAuthor = currentPost.data && currentPost.data.author;
				const currentTags = new Set(
					(currentPost.data && currentPost.data.tags) || [],
				);
				const excludeTags = new Set(["posts", "blog"]);
				const meaningfulTags = new Set(
					[...currentTags].filter((tag) => !excludeTags.has(tag)),
				);

				if (!currentAuthor) {
					return []; // Silent return for pages without authors
				}

				// Filter to only other authors' posts
				const currentUrl = currentPost.url || currentPost.inputPath || "";
				const crossAuthorPosts = allPosts.filter((post) => {
					if (post.url === currentUrl) return false;
					if (post.data && post.data.draft) return false;
					if (post.data && post.data.author === currentAuthor) return false; // Different authors only
					return true;
				});

				// Score posts based on tag similarity and recency
				const scoredPosts = crossAuthorPosts.map((post) => {
					const postTags = new Set(post.data.tags || []);
					const postMeaningfulTags = new Set(
						[...postTags].filter((tag) => !excludeTags.has(tag)),
					);

					// Calculate tag similarity
					const sharedTags = [...meaningfulTags].filter((tag) =>
						postMeaningfulTags.has(tag),
					);
					const tagScore = sharedTags.length;

					// Recency bonus
					const postDate = new Date(post.data.date);
					const daysSincePost = (new Date() - postDate) / (1000 * 60 * 60 * 24);
					const recencyScore = Math.max(0, (90 - daysSincePost) / 90); // 90-day decay

					// Quality score (posts with more meaningful tags might be higher quality)
					const qualityScore = Math.min(postMeaningfulTags.size, 5) * 0.1;

					const totalScore = tagScore * 2 + recencyScore + qualityScore;

					return {
						post,
						score: totalScore,
						sharedTags,
						author: post.data.author,
					};
				});

				// Sort by score and diversify by author
				const sortedPosts = scoredPosts.sort((a, b) => b.score - a.score);

				// Ensure author diversity in recommendations
				const recommendations = [];
				const seenAuthors = new Set();
				const maxPerAuthor = Math.ceil(limit / 2); // Allow up to 2 posts per author in a 4-post list

				for (const scored of sortedPosts) {
					const authorCount = [...recommendations].filter(
						(r) => r.data.author === scored.author,
					).length;

					if (authorCount < maxPerAuthor || recommendations.length < limit) {
						recommendations.push(scored.post);
						seenAuthors.add(scored.author);

						if (recommendations.length >= limit) break;
					}
				}

				return recommendations;
			} catch (error) {
				console.warn("crossAuthorRecommendations filter error:", error.message);
				return [];
			}
		},
	);

	// Discover authors: Get a sample of posts from authors you haven't read much
	eleventyConfig.addFilter(
		"discoverAuthors",
		function (currentPost, allPosts, limit = 3) {
			if (!currentPost || !allPosts) return [];

			const currentAuthor = currentPost.data.author;

			// Group posts by author
			const postsByAuthor = {};
			allPosts
				.filter(
					(post) => !post.data.draft && post.data.author !== currentAuthor,
				)
				.forEach((post) => {
					const author = post.data.author;
					if (!postsByAuthor[author]) {
						postsByAuthor[author] = [];
					}
					postsByAuthor[author].push(post);
				});

			// Get the most recent post from each other author
			const authorSamples = Object.entries(postsByAuthor)
				.map(([author, posts]) => {
					// Sort by date and take most recent
					const sortedPosts = posts.sort(
						(a, b) => new Date(b.data.date) - new Date(a.data.date),
					);
					return {
						author,
						post: sortedPosts[0],
						postCount: posts.length,
					};
				})
				.sort((a, b) => {
					// Prioritize authors with more posts, then by recency
					if (b.postCount !== a.postCount) {
						return b.postCount - a.postCount;
					}
					return new Date(b.post.data.date) - new Date(a.post.data.date);
				})
				.slice(0, limit);

			return authorSamples.map((sample) => sample.post);
		},
	);

	// Author similarity: Find authors who write about similar topics
	eleventyConfig.addFilter(
		"similarAuthors",
		function (currentPost, allPosts, allAuthors, limit = 3) {
			if (!currentPost || !allPosts || !allAuthors) return [];

			const currentAuthor = currentPost.data.author;
			const currentTags = new Set(currentPost.data.tags || []);
			const excludeTags = new Set(["posts", "blog"]);

			// Get all meaningful tags for current post
			const meaningfulCurrentTags = new Set(
				[...currentTags].filter((tag) => !excludeTags.has(tag)),
			);

			if (meaningfulCurrentTags.size === 0) return [];

			// Analyze each other author's tag patterns
			const authorTagAnalysis = {};

			allPosts
				.filter(
					(post) =>
						!post.data.draft &&
						post.data.author !== currentAuthor &&
						post.data.author,
				)
				.forEach((post) => {
					const author = post.data.author;
					const postTags = new Set(post.data.tags || []);
					const meaningfulPostTags = new Set(
						[...postTags].filter((tag) => !excludeTags.has(tag)),
					);

					if (!authorTagAnalysis[author]) {
						authorTagAnalysis[author] = {
							tags: new Set(),
							postCount: 0,
							recentPost: post,
						};
					}

					// Add all meaningful tags from this post
					meaningfulPostTags.forEach((tag) => {
						authorTagAnalysis[author].tags.add(tag);
					});

					authorTagAnalysis[author].postCount++;

					// Track most recent post
					if (
						new Date(post.data.date) >
						new Date(authorTagAnalysis[author].recentPost.data.date)
					) {
						authorTagAnalysis[author].recentPost = post;
					}
				});

			// Calculate similarity scores
			const authorSimilarities = Object.entries(authorTagAnalysis)
				.map(([author, analysis]) => {
					const sharedTags = [...meaningfulCurrentTags].filter((tag) =>
						analysis.tags.has(tag),
					);

					const totalUniqueTags = new Set([
						...meaningfulCurrentTags,
						...analysis.tags,
					]).size;

					const jaccardSimilarity =
						totalUniqueTags > 0 ? sharedTags.length / totalUniqueTags : 0;

					// Boost score for authors with more posts (more reliable similarity)
					const experienceBonus = Math.min(analysis.postCount, 10) * 0.01;

					return {
						author,
						similarity: jaccardSimilarity + experienceBonus,
						sharedTags,
						recentPost: analysis.recentPost,
						postCount: analysis.postCount,
					};
				})
				.filter((analysis) => analysis.similarity > 0)
				.sort((a, b) => b.similarity - a.similarity)
				.slice(0, limit);

			return authorSimilarities.map((analysis) => analysis.recentPost);
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
