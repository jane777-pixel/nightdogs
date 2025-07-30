// Theme initialization script - runs in <head> to prevent FOUC
(function () {
	const THEME_KEY = "author-theme";
	const DEFAULT_THEME = "jane";

	// If the server has already set the author (e.g., on a post page),
	// we don't need to do anything
	if (document.documentElement.dataset.author) {
		return;
	}

	// For non-post pages, apply the theme from localStorage or use the default
	try {
		const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
		document.documentElement.setAttribute("data-author", savedTheme);
	} catch (e) {
		// If localStorage is not available, fall back to the default theme
		document.documentElement.setAttribute("data-author", DEFAULT_THEME);
	}
})();
