// Site search. The index (/search-index.json) is only downloaded the first
// time someone opens search. Open with the Search button, "/" or Ctrl/⌘+K.
(function () {
	const triggers = document.querySelectorAll("[data-search-trigger]");
	if (!triggers.length || typeof HTMLDialogElement === "undefined") return;

	let index = null;
	let opener = null;

	const dialog = document.createElement("dialog");
	dialog.className = "search-dialog";
	dialog.setAttribute("aria-label", "Search posts");
	dialog.innerHTML = `
		<div class="search-header">
			<label>
				<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
				<span class="visually-hidden">Search posts</span>
				<input id="search-input" type="search" autocomplete="off" spellcheck="false"
					placeholder="Search posts, authors, tags…" aria-controls="search-results">
			</label>
			<button type="button" class="search-close" aria-label="Close search">✕</button>
		</div>
		<p class="search-status" role="status" aria-live="polite"></p>
		<ul id="search-results" class="search-results"></ul>
		<div class="search-footer" aria-hidden="true">
			<span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
			<span><kbd>Enter</kbd> open</span>
			<span><kbd>Esc</kbd> close</span>
		</div>`;
	document.body.append(dialog);

	const input = dialog.querySelector("#search-input");
	const list = dialog.querySelector("#search-results");
	const status = dialog.querySelector(".search-status");

	async function loadIndex() {
		if (index) return index;
		status.textContent = "Loading…";
		try {
			const response = await fetch("/search-index.json");
			index = response.ok ? await response.json() : [];
		} catch {
			index = [];
		}
		status.textContent = "";
		return index;
	}

	function escapeHtml(text) {
		return String(text).replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
		);
	}

	function highlight(text, words) {
		let html = escapeHtml(text);
		for (const word of words) {
			const safe = escapeHtml(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			html = html.replace(new RegExp(`(${safe})`, "gi"), "<mark>$1</mark>");
		}
		return html;
	}

	// Short excerpt around the first match in the post text
	function snippet(post, words) {
		const text = post.content || "";
		const lower = text.toLowerCase();
		const at = words.map((w) => lower.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
		if (at === undefined) return post.excerpt || "";
		const start = Math.max(0, at - 60);
		return (start > 0 ? "…" : "") + text.slice(start, start + 170).trim() + "…";
	}

	function score(post, words) {
		const title = post.title.toLowerCase();
		const meta = `${post.authorName} ${post.author} ${(post.tags || []).join(" ")}`.toLowerCase();
		const body = (post.content || "").toLowerCase();
		let total = 0;
		for (const word of words) {
			if (title.includes(word)) total += 10;
			else if (meta.includes(word)) total += 5;
			else if (body.includes(word)) total += 1;
			else return 0; // every word has to match somewhere
		}
		return total;
	}

	function render(query) {
		const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
		list.innerHTML = "";
		if (!words.length) {
			status.textContent = "";
			return;
		}
		const results = (index || [])
			.map((post) => ({ post, score: score(post, words) }))
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
			.slice(0, 12);

		status.textContent = results.length
			? `${results.length} post${results.length === 1 ? "" : "s"} found`
			: `Nothing found for “${query}”`;

		list.innerHTML = results
			.map(({ post }) => {
				const date = new Date(post.date).toLocaleDateString(undefined, {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
				return `<li class="search-result"><a href="${escapeHtml(post.url)}">
					<span class="result-title">${highlight(post.title, words)}</span>
					<span class="result-meta">${escapeHtml(post.authorName)} · ${date}</span>
					<span class="result-excerpt">${highlight(snippet(post, words), words)}</span>
				</a></li>`;
			})
			.join("");
	}

	async function open(from) {
		opener = from || document.activeElement;
		dialog.showModal();
		input.focus();
		input.select();
		await loadIndex();
		render(input.value);
	}

	function close() {
		dialog.close();
	}

	dialog.addEventListener("close", () => {
		if (opener && typeof opener.focus === "function") opener.focus();
	});

	triggers.forEach((trigger) =>
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			open(trigger);
		}),
	);

	let timer;
	input.addEventListener("input", () => {
		clearTimeout(timer);
		timer = setTimeout(() => render(input.value), 120);
	});

	dialog.querySelector(".search-close").addEventListener("click", close);
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) close();
	});

	// Arrow keys move between the search box and results
	dialog.addEventListener("keydown", (event) => {
		const links = Array.from(list.querySelectorAll("a"));
		const current = links.indexOf(document.activeElement);
		if (event.key === "ArrowDown") {
			event.preventDefault();
			(links[current + 1] || links[0])?.focus();
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			if (current <= 0) input.focus();
			else links[current - 1].focus();
		} else if (event.key === "Enter" && document.activeElement === input && links[0]) {
			event.preventDefault();
			links[0].click();
		}
	});

	// Keyboard shortcuts to open search
	document.addEventListener("keydown", (event) => {
		if (dialog.open) return;
		const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
		if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
			event.preventDefault();
			open();
		}
	});
})();
