/**
 * Privacy-focused Analytics and Performance Monitoring for nightdogs.xyz
 * Tracks performance metrics and basic usage patterns without invasive tracking
 */

class NightdogsAnalytics {
	constructor(options = {}) {
		this.options = {
			endpoint: '/api/analytics', // Would need to be implemented
			enableConsoleLogging: true,
			trackPerformance: true,
			trackInteractions: true,
			trackErrors: false,
			sessionTimeout: 30 * 60 * 1000, // 30 minutes
			...options
		};

		this.session = {
			id: this.generateSessionId(),
			startTime: Date.now(),
			pageViews: 0,
			interactions: 0,
			author: null,
			theme: null
		};

		this.metrics = {
			performance: {},
			interactions: [],
			errors: []
		};

		this.init();
	}

	init() {
		this.detectAuthorAndTheme();

		if (this.options.trackPerformance) {
			this.trackPerformanceMetrics();
			this.trackCoreWebVitals();
		}

		if (this.options.trackInteractions) {
			this.trackBasicInteractions();
		}

		if (this.options.trackErrors) {
			this.trackErrors();
		}

		this.trackPageView();
		this.setupEventListeners();

		// Clean up old sessions periodically
		this.cleanupOldSessions();

		if (this.options.enableConsoleLogging) {
			console.log('[Analytics] Initialized privacy-focused analytics');
		}
	}

	generateSessionId() {
		// Generate a simple session ID (not personally identifying)
		return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	detectAuthorAndTheme() {
		this.session.author = document.documentElement.getAttribute('data-author') || 'unknown';
		this.session.theme = document.body.getAttribute('data-theme') || 'auto';
	}

	trackPerformanceMetrics() {
		// Track basic performance metrics
		if ('performance' in window) {
			const perfData = performance.getEntriesByType('navigation')[0];
			if (perfData) {
				this.metrics.performance = {
					pageLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
					domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
					firstPaint: this.getFirstPaint(),
					resourceCount: performance.getEntriesByType('resource').length,
					timestamp: Date.now()
				};
			}
		}
	}

	getFirstPaint() {
		if ('performance' in window) {
			const paintEntries = performance.getEntriesByType('paint');
			const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
			return firstPaint ? Math.round(firstPaint.startTime) : null;
		}
		return null;
	}

	trackCoreWebVitals() {
		// Track Core Web Vitals if supported
		if ('PerformanceObserver' in window) {
			// Largest Contentful Paint (LCP)
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				const lastEntry = entries[entries.length - 1];
				this.metrics.performance.lcp = Math.round(lastEntry.startTime);
			}).observe({ entryTypes: ['largest-contentful-paint'] });

			// First Input Delay (FID)
			new PerformanceObserver((entryList) => {
				const firstInput = entryList.getEntries()[0];
				if (firstInput) {
					this.metrics.performance.fid = Math.round(firstInput.processingStart - firstInput.startTime);
				}
			}).observe({ entryTypes: ['first-input'] });

			// Cumulative Layout Shift (CLS)
			let clsValue = 0;
			new PerformanceObserver((entryList) => {
				for (const entry of entryList.getEntries()) {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				}
				this.metrics.performance.cls = Math.round(clsValue * 1000) / 1000;
			}).observe({ entryTypes: ['layout-shift'] });
		}
	}

	trackBasicInteractions() {
		// Track basic, non-invasive interactions
		const interactions = [
			{ event: 'click', selector: 'a[href^="/blog"]', name: 'blog_link_click' },
			{ event: 'click', selector: '[data-search-trigger]', name: 'search_open' },
			{ event: 'click', selector: '[data-theme-toggle]', name: 'theme_toggle' },
			{ event: 'change', selector: '#author-select', name: 'author_theme_change' },
			{ event: 'click', selector: '.tag', name: 'tag_click' },
			{ event: 'click', selector: '.related-post a', name: 'related_post_click' }
		];

		interactions.forEach(({ event, selector, name }) => {
			document.addEventListener(event, (e) => {
				if (e.target.matches && e.target.matches(selector)) {
					this.logInteraction(name, {
						element: selector,
						timestamp: Date.now()
					});
				}
			});
		});

		// Track scroll depth
		this.trackScrollDepth();
	}

	trackScrollDepth() {
		const scrollMarkers = [25, 50, 75, 100];
		const reached = new Set();

		const checkScrollDepth = () => {
			const scrollPercent = Math.round(
				(window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
			);

			scrollMarkers.forEach(marker => {
				if (scrollPercent >= marker && !reached.has(marker)) {
					reached.add(marker);
					this.logInteraction('scroll_depth', {
						depth: marker,
						timestamp: Date.now()
					});
				}
			});
		};

		let ticking = false;
		window.addEventListener('scroll', () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					checkScrollDepth();
					ticking = false;
				});
				ticking = true;
			}
		});
	}

	trackErrors() {
		window.addEventListener('error', (event) => {
			this.logError({
				message: event.message,
				filename: event.filename,
				line: event.lineno,
				column: event.colno,
				timestamp: Date.now()
			});
		});

		window.addEventListener('unhandledrejection', (event) => {
			this.logError({
				message: 'Unhandled Promise Rejection: ' + event.reason,
				type: 'promise',
				timestamp: Date.now()
			});
		});
	}

	setupEventListeners() {
		// Listen for theme changes
		document.addEventListener('themechange', (e) => {
			this.session.theme = e.detail.resolvedTheme;
			this.logInteraction('theme_change', {
				from: this.session.theme,
				to: e.detail.resolvedTheme,
				mode: e.detail.theme, // auto/light/dark
				timestamp: Date.now()
			});
		});

		// Listen for author theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'data-author') {
					const newAuthor = document.documentElement.getAttribute('data-author');
					if (newAuthor !== this.session.author) {
						this.logInteraction('author_theme_change', {
							from: this.session.author,
							to: newAuthor,
							timestamp: Date.now()
						});
						this.session.author = newAuthor;
					}
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-author']
		});

		// Track time on page before unload
		window.addEventListener('beforeunload', () => {
			this.trackSessionEnd();
		});

		// Track visibility changes
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.logInteraction('page_hidden', { timestamp: Date.now() });
			} else {
				this.logInteraction('page_visible', { timestamp: Date.now() });
			}
		});
	}

	trackPageView() {
		this.session.pageViews++;

		const pageData = {
			url: window.location.pathname,
			referrer: document.referrer || 'direct',
			author: this.session.author,
			theme: this.session.theme,
			timestamp: Date.now(),
			sessionId: this.session.id
		};

		this.logEvent('page_view', pageData);
	}

	logInteraction(name, data = {}) {
		this.session.interactions++;

		const interaction = {
			name,
			data,
			sessionId: this.session.id,
			author: this.session.author,
			theme: this.session.theme
		};

		this.metrics.interactions.push(interaction);

		if (this.options.enableConsoleLogging) {
			console.log('[Analytics] Interaction:', name, data);
		}

		// Keep only last 50 interactions to prevent memory issues
		if (this.metrics.interactions.length > 50) {
			this.metrics.interactions = this.metrics.interactions.slice(-50);
		}
	}

	logError(error) {
		this.metrics.errors.push({
			...error,
			sessionId: this.session.id,
			url: window.location.pathname,
			userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
		});

		if (this.options.enableConsoleLogging) {
			console.warn('[Analytics] Error logged:', error);
		}

		// Keep only last 10 errors
		if (this.metrics.errors.length > 10) {
			this.metrics.errors = this.metrics.errors.slice(-10);
		}
	}

	logEvent(type, data) {
		const event = {
			type,
			data,
			timestamp: Date.now(),
			sessionId: this.session.id
		};

		if (this.options.enableConsoleLogging) {
			console.log('[Analytics] Event:', type, data);
		}

		// In a real implementation, you might send this to an endpoint
		// this.sendToEndpoint(event);
	}

	trackSessionEnd() {
		const sessionDuration = Date.now() - this.session.startTime;

		this.logEvent('session_end', {
			duration: sessionDuration,
			pageViews: this.session.pageViews,
			interactions: this.session.interactions,
			performance: this.metrics.performance
		});
	}

	// Get analytics summary for debugging/display
	getAnalyticsSummary() {
		return {
			session: {
				...this.session,
				duration: Date.now() - this.session.startTime
			},
			metrics: this.metrics,
			browserInfo: {
				userAgent: navigator.userAgent.substring(0, 100),
				language: navigator.language,
				screen: `${screen.width}x${screen.height}`,
				viewport: `${window.innerWidth}x${window.innerHeight}`,
				connection: navigator.connection ? {
					effectiveType: navigator.connection.effectiveType,
					downlink: navigator.connection.downlink
				} : null
			}
		};
	}

	cleanupOldSessions() {
		// Simple cleanup of any stored session data older than session timeout
		try {
			const stored = localStorage.getItem('nightdogs-session-data');
			if (stored) {
				const data = JSON.parse(stored);
				const isExpired = (Date.now() - data.timestamp) > this.options.sessionTimeout;

				if (isExpired) {
					localStorage.removeItem('nightdogs-session-data');
				}
			}
		} catch (e) {
			// Ignore localStorage errors
		}
	}

	// Public method to manually track events
	track(eventName, data = {}) {
		this.logEvent('custom', { name: eventName, ...data });
	}

	// Export analytics data (for debugging or optional reporting)
	exportData() {
		return {
			version: '1.0.0',
			exported: new Date().toISOString(),
			...this.getAnalyticsSummary()
		};
	}
}

// Auto-initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	// Only initialize if not in development mode or if explicitly enabled
	const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	const forceEnable = localStorage.getItem('nightdogs-enable-analytics') === 'true';

	if (!isDev || forceEnable) {
		window.nightdogsAnalytics = new NightdogsAnalytics({
			enableConsoleLogging: isDev || forceEnable,
			trackPerformance: true,
			trackInteractions: true,
			trackErrors: true
		});

		// Make summary available in console for debugging
		if (isDev || forceEnable) {
			window.getAnalyticsSummary = () => window.nightdogsAnalytics.getAnalyticsSummary();
			window.exportAnalytics = () => window.nightdogsAnalytics.exportData();

			console.log('[Analytics] Debug commands available:');
			console.log('- getAnalyticsSummary(): Get current analytics data');
			console.log('- exportAnalytics(): Export all analytics data');
			console.log('- nightdogsAnalytics.track("event_name", {data}): Track custom events');
		}
	}
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = NightdogsAnalytics;
}
