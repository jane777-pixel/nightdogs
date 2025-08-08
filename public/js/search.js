/**
 * Simple client-side search for nightdogs.xyz
 * Minimal implementation to avoid conflicts with existing functionality
 */

(function () {
	"use strict";

	let searchData = [];
	let isInitialized = false;

	// Simple search functionality
	class SimpleSearch {
		constructor() {
			this.searchInput = null;
			this.resultsContainer = null;
			this.overlay = null;
			this.currentQuery = "";
			this.isOpen = false;
		}

		async init() {
			// Load search data
			await this.loadSearchData();

			// Set up UI
			this.setupUI();
			this.bindEvents();

			isInitialized = true;
		}

		async loadSearchData() {
			try {
				const response = await fetch("/search-index.json");
				if (response.ok) {
					searchData = await response.json();
				}
			} catch (error) {
				console.warn("Could not load search data:", error);
				searchData = [];
			}
		}

		setupUI() {
			// Create search overlay if it doesn't exist
			if (!document.getElementById("search-overlay")) {
				this.createSearchOverlay();
			}

			this.searchInput = document.getElementById("search-input");
			this.resultsContainer = document.getElementById("search-results");
			this.overlay = document.getElementById("search-overlay");
		}

		createSearchOverlay() {
			const overlay = document.createElement("div");
			overlay.id = "search-overlay";
			overlay.className = "search-overlay";
			overlay.innerHTML = `
        <div class="search-modal">
          <div class="search-header">
            <input type="search" id="search-input" placeholder="Search posts..." autocomplete="off">
            <button class="search-close" aria-label="Close search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div id="search-results" class="search-results"></div>
          <div class="search-footer">
            <kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Select <kbd>Esc</kbd> Close
          </div>
        </div>
      `;
			document.body.appendChild(overlay);
		}

		bindEvents() {
			// Search trigger buttons
			const triggers = document.querySelectorAll("[data-search-trigger]");
			triggers.forEach((trigger) => {
				trigger.addEventListener("click", (e) => {
					e.preventDefault();
					this.open();
				});
			});

			// Keyboard shortcut (Ctrl/Cmd + K)
			document.addEventListener("keydown", (e) => {
				if ((e.ctrlKey || e.metaKey) && e.key === "k") {
					e.preventDefault();
					this.open();
				}
				if (e.key === "Escape" && this.isOpen) {
					this.close();
				}
			});

			if (this.searchInput) {
				this.searchInput.addEventListener("input", (e) => {
					this.search(e.target.value);
				});
			}

			if (this.overlay) {
				this.overlay.addEventListener("click", (e) => {
					if (e.target === this.overlay) {
						this.close();
					}
				});

				const closeBtn = this.overlay.querySelector(".search-close");
				if (closeBtn) {
					closeBtn.addEventListener("click", () => this.close());
				}
			}
		}

		open() {
			if (!this.overlay) return;

			this.overlay.classList.add("active");
			this.isOpen = true;

			if (this.searchInput) {
				this.searchInput.focus();
				this.searchInput.value = "";
			}

			if (this.resultsContainer) {
				this.resultsContainer.innerHTML = "";
			}

			document.body.style.overflow = "hidden";
		}

		close() {
			if (!this.overlay) return;

			this.overlay.classList.remove("active");
			this.isOpen = false;
			document.body.style.overflow = "";
			this.currentQuery = "";
		}

		search(query) {
			this.currentQuery = query.trim().toLowerCase();

			if (this.currentQuery.length < 2) {
				this.displayResults([]);
				return;
			}

			const results = this.performSearch(this.currentQuery);
			this.displayResults(results);
		}

		performSearch(query) {
			if (!searchData || searchData.length === 0) return [];

			const matches = searchData.filter((post) => {
				const title = post.title.toLowerCase();
				const content = (post.content || "").toLowerCase();
				const author = post.author.toLowerCase();
				const tags = post.tags.join(" ").toLowerCase();

				return (
					title.includes(query) ||
					content.includes(query) ||
					author.includes(query) ||
					tags.includes(query)
				);
			});

			// Sort by relevance (title matches first)
			return matches
				.sort((a, b) => {
					const aTitle = a.title.toLowerCase();
					const bTitle = b.title.toLowerCase();

					if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
					if (!aTitle.includes(query) && bTitle.includes(query)) return 1;

					return new Date(b.date) - new Date(a.date);
				})
				.slice(0, 5);
		}

		displayResults(results) {
			if (!this.resultsContainer) return;

			if (results.length === 0) {
				this.resultsContainer.innerHTML =
					'<div class="no-results">No posts found</div>';
				return;
			}

			const html = results
				.map((post) => {
					const date = new Date(post.date).toLocaleDateString();
					const title = this.highlightText(post.title, this.currentQuery);

					return `
          <div class="search-result" onclick="window.location.href='${post.url}'">
            <h3 class="result-title">
              <a href="${post.url}">${title}</a>
            </h3>
            <div class="result-meta">
              <span class="result-author">${post.author}</span>
              <span class="result-date">${date}</span>
            </div>
          </div>
        `;
				})
				.join("");

			this.resultsContainer.innerHTML = html;
		}

		highlightText(text, query) {
			if (!query) return text;

			const regex = new RegExp(
				`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
				"gi",
			);
			return text.replace(regex, "<mark>$1</mark>");
		}
	}

	// Initialize when DOM is ready
	document.addEventListener("DOMContentLoaded", function () {
		// Only initialize if search triggers exist
		if (document.querySelector("[data-search-trigger]")) {
			const search = new SimpleSearch();
			search
				.init()
				.then(() => {
					window.nightdogsSearch = search;
				})
				.catch((error) => {
					console.warn("Search initialization failed:", error);
				});
		}
	});
})();
