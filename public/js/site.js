// Site-wide behaviour: author themes, dark mode, mobile menu, Cat/Dog link.
// The initial theme is applied by a tiny inline script in <head> (see
// base.njk) so the page never flashes the wrong colours.
(function () {
	const root = document.documentElement;
	const AUTHOR_KEY = "author-theme";
	const DARK_KEY = "nightdogs-dark-mode";
	const DEFAULT_AUTHOR = "jane";
	const dogPeople = window.NIGHTDOGS_DOG_PEOPLE || {};

	const store = {
		get(key) {
			try {
				return localStorage.getItem(key);
			} catch {
				return null;
			}
		},
		set(key, value) {
			try {
				localStorage.setItem(key, value);
			} catch {
				/* private mode etc. */
			}
		},
	};

	// ---- Author themes -------------------------------------------------
	const selects = document.querySelectorAll(".author-sync");

	function applyAuthor(author) {
		root.setAttribute("data-author", author);
		selects.forEach((select) => {
			if (select.value !== author) select.value = author;
		});
		updateCatLink();
	}

	function setAuthor(author, { save = true } = {}) {
		applyAuthor(author);
		if (save) store.set(AUTHOR_KEY, author);
	}

	function savedAuthor() {
		return store.get(AUTHOR_KEY) || DEFAULT_AUTHOR;
	}

	selects.forEach((select) => {
		select.value = root.getAttribute("data-author") || DEFAULT_AUTHOR;
		select.addEventListener("change", () => setAuthor(select.value));
	});

	// ---- Cat / Dog ------------------------------------------------------
	function updateCatLink() {
		const author = root.getAttribute("data-author");
		document.querySelectorAll("[data-cat-link]").forEach((link) => {
			link.textContent = dogPeople[author] ? "Dog" : "Cat";
		});
	}
	updateCatLink();

	// ---- Dark mode ------------------------------------------------------
	const darkToggle = document.getElementById("dark-mode-toggle");
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

	function isDark() {
		const theme = root.getAttribute("data-theme");
		return theme ? theme === "dark" : prefersDark.matches;
	}

	function renderDarkToggle() {
		if (!darkToggle) return;
		const dark = isDark();
		darkToggle.setAttribute("aria-pressed", String(dark));
		darkToggle.querySelector("[data-icon]").textContent = dark ? "☀︎" : "☾";
		darkToggle.title = dark ? "Switch to light mode" : "Switch to dark mode";
	}

	if (darkToggle) {
		darkToggle.addEventListener("click", () => {
			const dark = !isDark();
			root.setAttribute("data-theme", dark ? "dark" : "light");
			store.set(DARK_KEY, String(dark));
			renderDarkToggle();
		});
		prefersDark.addEventListener("change", renderDarkToggle);
		renderDarkToggle();
	}

	// ---- Mobile menu ----------------------------------------------------
	const menuToggle = document.querySelector(".menu-toggle");
	const menu = document.getElementById("site-menu");
	const mobileQuery = window.matchMedia("(max-width: 760px)");

	function setMenu(open, { focusToggle = false } = {}) {
		if (!menuToggle || !menu) return;
		menuToggle.setAttribute("aria-expanded", String(open));
		const collapsed = mobileQuery.matches && !open;
		menu.toggleAttribute("data-collapsed", collapsed);
		menu.inert = collapsed;
		if (focusToggle) menuToggle.focus();
	}

	if (menuToggle && menu) {
		setMenu(false);
		menuToggle.addEventListener("click", () => {
			setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
		});
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
				setMenu(false, { focusToggle: true });
			}
		});
		document.addEventListener("click", (event) => {
			if (
				menuToggle.getAttribute("aria-expanded") === "true" &&
				!menu.contains(event.target) &&
				!menuToggle.contains(event.target)
			) {
				setMenu(false);
			}
		});
		mobileQuery.addEventListener("change", () => setMenu(false));
	}

	// Small API for pages that preview themes (e.g. the Authors page)
	window.nightdogs = {
		setAuthor,
		previewAuthor: (author) => applyAuthor(author),
		restoreAuthor: () => applyAuthor(root.dataset.pageAuthor || savedAuthor()),
	};
})();
