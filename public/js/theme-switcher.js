/**
 * Theme Switcher for nightdogs.xyz
 * Handles light/dark/auto theme switching with system preference detection
 * Integrates with per-author theming system
 */

class ThemeSwitcher {
	constructor(options = {}) {
		this.options = {
			storageKey: "nightdogs-theme",
			toggleSelector: "[data-theme-toggle]",
			bodyAttribute: "data-theme",
			authorAttribute: "data-author",
			systemPreferenceQuery: "(prefers-color-scheme: dark)",
			transitions: true,
			...options,
		};

		this.themes = ["auto", "light", "dark"];
		this.currentTheme = "auto";
		this.systemPreference = "light";
		this.mediaQuery = null;

		this.init();
	}

	init() {
		// Set up system preference detection
		this.setupSystemDetection();

		// Load saved preference or default to auto
		this.loadThemePreference();

		// Apply initial theme
		this.applyTheme(this.currentTheme);

		// Set up UI controls
		this.setupControls();

		// Set up page visibility handling
		this.setupVisibilityHandling();

		console.log("[Theme] Initialized with theme:", this.currentTheme);
	}

	setupSystemDetection() {
		// Check if the browser supports prefers-color-scheme
		if (window.matchMedia) {
			this.mediaQuery = window.matchMedia(this.options.systemPreferenceQuery);
			this.systemPreference = this.mediaQuery.matches ? "dark" : "light";

			// Listen for system preference changes
			this.mediaQuery.addEventListener("change", (e) => {
				this.systemPreference = e.matches ? "dark" : "light";

				// If user is on auto mode, update the theme
				if (this.currentTheme === "auto") {
					this.applyTheme("auto");
				}
			});
		}
	}

	loadThemePreference() {
		try {
			const saved = localStorage.getItem(this.options.storageKey);
			if (saved && this.themes.includes(saved)) {
				this.currentTheme = saved;
			}
		} catch (error) {
			console.warn("[Theme] Could not load theme preference:", error);
		}
	}

	saveThemePreference() {
		try {
			localStorage.setItem(this.options.storageKey, this.currentTheme);
		} catch (error) {
			console.warn("[Theme] Could not save theme preference:", error);
		}
	}

	setupControls() {
		// Find theme toggle buttons
		const toggleButtons = document.querySelectorAll(
			this.options.toggleSelector,
		);

		toggleButtons.forEach((button) => {
			// Set initial state
			this.updateToggleButton(button);

			// Add click handler
			button.addEventListener("click", (e) => {
				e.preventDefault();
				this.toggleTheme();
			});
		});

		// Keyboard shortcut (Ctrl/Cmd + Shift + D for Dark mode)
		document.addEventListener("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
				e.preventDefault();
				this.toggleTheme();
			}
		});
	}

	setupVisibilityHandling() {
		// Re-apply theme when page becomes visible (handles system changes while page was hidden)
		document.addEventListener("visibilitychange", () => {
			if (!document.hidden && this.currentTheme === "auto") {
				this.applyTheme("auto");
			}
		});
	}

	toggleTheme() {
		const currentIndex = this.themes.indexOf(this.currentTheme);
		const nextIndex = (currentIndex + 1) % this.themes.length;
		const nextTheme = this.themes[nextIndex];

		this.setTheme(nextTheme);
	}

	setTheme(theme) {
		if (!this.themes.includes(theme)) {
			console.warn("[Theme] Invalid theme:", theme);
			return;
		}

		this.currentTheme = theme;
		this.saveThemePreference();
		this.applyTheme(theme);
		this.updateControls();

		// Dispatch custom event
		this.dispatchThemeChangeEvent();
	}

	applyTheme(theme) {
		const body = document.body;
		const resolvedTheme = this.resolveTheme(theme);

		// Temporarily disable transitions to prevent flash
		if (this.options.transitions) {
			this.disableTransitions();
		}

		// Update body attribute
		body.setAttribute(this.options.bodyAttribute, resolvedTheme);

		// Update meta theme-color for mobile browsers
		this.updateThemeColor(resolvedTheme);

		// Update any custom theme variables based on current author
		this.updateAuthorThemeVars(resolvedTheme);

		// Re-enable transitions after a brief delay
		if (this.options.transitions) {
			setTimeout(() => this.enableTransitions(), 100);
		}
	}

	resolveTheme(theme) {
		if (theme === "auto") {
			return this.systemPreference;
		}
		return theme;
	}

	updateThemeColor(resolvedTheme) {
		// Update meta theme-color tag
		let themeColorMeta = document.querySelector('meta[name="theme-color"]');

		if (!themeColorMeta) {
			themeColorMeta = document.createElement("meta");
			themeColorMeta.name = "theme-color";
			document.head.appendChild(themeColorMeta);
		}

		// Get the current author to determine colors
		const currentAuthor = document.body.getAttribute(
			this.options.authorAttribute,
		);
		const themeColor = this.getThemeColorForAuthor(
			currentAuthor,
			resolvedTheme,
		);

		themeColorMeta.content = themeColor;
	}

	getThemeColorForAuthor(author, theme) {
		// Default colors
		const defaultColors = {
			light: "#ffffff",
			dark: "#1a1a1a",
		};

		// Try to get author-specific colors from CSS custom properties
		if (author) {
			const computedStyle = getComputedStyle(document.documentElement);
			const bgColor = computedStyle.getPropertyValue("--color-bg").trim();
			if (bgColor) {
				return bgColor;
			}
		}

		return defaultColors[theme] || defaultColors.light;
	}

	updateAuthorThemeVars(resolvedTheme) {
		// This method can be extended to update CSS custom properties
		// based on the current theme and author combination
		const root = document.documentElement;

		// Add a CSS class for the current resolved theme
		root.classList.remove("theme-light", "theme-dark");
		root.classList.add(`theme-${resolvedTheme}`);
	}

	updateControls() {
		const toggleButtons = document.querySelectorAll(
			this.options.toggleSelector,
		);
		toggleButtons.forEach((button) => this.updateToggleButton(button));
	}

	updateToggleButton(button) {
		// Update button text/icon based on current theme
		const themeNames = {
			auto: "Auto",
			light: "Light",
			dark: "Dark",
		};

		const themeIcons = {
			auto: "🌓",
			light: "☀️",
			dark: "🌙",
		};

		// Update text content if button has text
		const textElement = button.querySelector(".theme-text");
		if (textElement) {
			textElement.textContent = themeNames[this.currentTheme];
		} else if (!button.querySelector("svg, img")) {
			// Only update if button doesn't have custom icons
			button.textContent = `${themeIcons[this.currentTheme]} ${themeNames[this.currentTheme]}`;
		}

		// Update aria-label for accessibility
		button.setAttribute(
			"aria-label",
			`Switch theme (current: ${themeNames[this.currentTheme]})`,
		);

		// Update data attributes
		button.setAttribute("data-current-theme", this.currentTheme);
		button.setAttribute(
			"data-resolved-theme",
			this.resolveTheme(this.currentTheme),
		);
	}

	disableTransitions() {
		const style = document.createElement("style");
		style.id = "disable-theme-transitions";
		style.textContent = `
			*,
			*::before,
			*::after {
				transition: none !important;
				animation-duration: 0s !important;
			}
		`;
		document.head.appendChild(style);
	}

	enableTransitions() {
		const style = document.getElementById("disable-theme-transitions");
		if (style) {
			style.remove();
		}
	}

	dispatchThemeChangeEvent() {
		const event = new CustomEvent("themechange", {
			detail: {
				theme: this.currentTheme,
				resolvedTheme: this.resolveTheme(this.currentTheme),
				systemPreference: this.systemPreference,
			},
		});

		document.dispatchEvent(event);
	}

	// Public methods for external control
	getCurrentTheme() {
		return this.currentTheme;
	}

	getResolvedTheme() {
		return this.resolveTheme(this.currentTheme);
	}

	getSystemPreference() {
		return this.systemPreference;
	}

	// Force theme (useful for testing or special cases)
	forceTheme(theme) {
		this.setTheme(theme);
	}
}

// Utility function to create theme toggle button
function createThemeToggle(options = {}) {
	const {
		className = "theme-toggle",
		position = "top-right",
		showText = true,
	} = options;

	const button = document.createElement("button");
	button.className = className;
	button.setAttribute("data-theme-toggle", "");
	button.setAttribute("type", "button");
	button.setAttribute("aria-label", "Toggle theme");

	if (showText) {
		button.innerHTML = `
			<span class="theme-icon">🌓</span>
			<span class="theme-text">Theme</span>
		`;
	} else {
		button.innerHTML = `
			<span class="theme-icon" aria-hidden="true">🌓</span>
			<span class="sr-only">Toggle theme</span>
		`;
	}

	// Add positioning styles if specified
	if (position) {
		button.style.position = "fixed";
		button.style.zIndex = "1000";

		switch (position) {
			case "top-right":
				button.style.top = "1rem";
				button.style.right = "1rem";
				break;
			case "top-left":
				button.style.top = "1rem";
				button.style.left = "1rem";
				break;
			case "bottom-right":
				button.style.bottom = "1rem";
				button.style.right = "1rem";
				break;
			case "bottom-left":
				button.style.bottom = "1rem";
				button.style.left = "1rem";
				break;
		}
	}

	return button;
}

// Error boundary for theme switcher
function handleThemeError(error, context = "theme") {
	console.warn(`[Theme Error] ${context}:`, error);

	// Fallback to basic theme functionality
	try {
		// Ensure at least basic theme is applied
		document.body.setAttribute("data-theme", "light");
		document.documentElement.classList.add("theme-light");

		// Hide broken theme toggles
		const toggles = document.querySelectorAll("[data-theme-toggle]");
		toggles.forEach((toggle) => {
			toggle.style.display = "none";
		});
	} catch (fallbackError) {
		console.warn("[Theme Error] Fallback also failed:", fallbackError);
	}
}

// Initialize theme switcher when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	try {
		// Check for required features
		const hasLocalStorage =
			typeof localStorage !== "undefined" && localStorage !== null;
		const hasMatchMedia = typeof window.matchMedia !== "undefined";

		if (!hasLocalStorage) {
			console.warn(
				"[Theme] localStorage not available, theme preferences won't persist",
			);
		}

		// Initialize the theme switcher
		window.themeSwitcher = new ThemeSwitcher();

		// Create toggle button if none exists
		if (!document.querySelector("[data-theme-toggle]")) {
			const toggle = createThemeToggle({ showText: false });
			document.body.appendChild(toggle);

			// Update the toggle button after switcher is initialized
			window.themeSwitcher.updateControls();
		}
	} catch (error) {
		handleThemeError(error, "initialization");
	}
});

// Apply theme immediately to prevent flash (inline script alternative)
(function () {
	try {
		const saved = localStorage.getItem("nightdogs-theme") || "auto";
		const systemDark =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		const resolvedTheme =
			saved === "auto" ? (systemDark ? "dark" : "light") : saved;

		document.documentElement.classList.add(`theme-${resolvedTheme}`);
		document.body.setAttribute("data-theme", resolvedTheme);
	} catch (e) {
		// Fallback to light theme
		document.documentElement.classList.add("theme-light");
		document.body.setAttribute("data-theme", "light");
	}
})();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
	module.exports = { ThemeSwitcher, createThemeToggle };
}
