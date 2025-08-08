/**
 * Comprehensive Performance Monitor for nightdogs.xyz
 * Tracks Core Web Vitals, performance metrics, and user experience indicators
 */

class PerformanceMonitor {
	constructor(options = {}) {
		this.options = {
			reportingEndpoint: '/api/performance',
			enableConsoleLogging: true,
			enableRealTimeReporting: false,
			performanceBudget: {
				lcp: 2500, // Largest Contentful Paint (ms)
				fid: 100,  // First Input Delay (ms)
				cls: 0.1,  // Cumulative Layout Shift
				ttfb: 600, // Time to First Byte (ms)
				fcp: 1800  // First Contentful Paint (ms)
			},
			sampleRate: 1.0, // 100% sampling
			bufferSize: 50,
			reportInterval: 30000, // 30 seconds
			...options
		};

		this.metrics = {
			coreWebVitals: {},
			performanceTiming: {},
			resourceMetrics: [],
			userExperience: {},
			errors: [],
			customMetrics: {}
		};

		this.observers = [];
		this.reportBuffer = [];
		this.sessionId = this.generateSessionId();
		this.pageLoadTime = performance.now();

		this.init();
	}

	init() {
		// Only proceed if performance APIs are available
		if (!('performance' in window)) {
			console.warn('[Performance] Performance API not available');
			return;
		}

		this.setupCoreWebVitalsObservers();
		this.trackPerformanceTiming();
		this.trackResourceMetrics();
		this.trackUserExperience();
		this.trackMemoryUsage();
		this.trackNetworkConditions();
		this.setupErrorTracking();
		this.startPeriodicReporting();

		// Track page visibility changes
		document.addEventListener('visibilitychange', () => {
			this.trackVisibilityChange();
		});

		// Track before page unload
		window.addEventListener('beforeunload', () => {
			this.finalReport();
		});

		if (this.options.enableConsoleLogging) {
			console.log('[Performance] Monitor initialized');
		}
	}

	generateSessionId() {
		return 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	setupCoreWebVitalsObservers() {
		// Largest Contentful Paint (LCP)
		this.observeMetric('largest-contentful-paint', (entries) => {
			const lastEntry = entries[entries.length - 1];
			this.metrics.coreWebVitals.lcp = {
				value: Math.round(lastEntry.startTime),
				timestamp: Date.now(),
				element: lastEntry.element?.tagName || 'unknown'
			};
			this.checkPerformanceBudget('lcp', lastEntry.startTime);
		});

		// First Input Delay (FID)
		this.observeMetric('first-input', (entries) => {
			const firstInput = entries[0];
			const fidValue = firstInput.processingStart - firstInput.startTime;
			this.metrics.coreWebVitals.fid = {
				value: Math.round(fidValue),
				timestamp: Date.now(),
				eventType: firstInput.name
			};
			this.checkPerformanceBudget('fid', fidValue);
		});

		// Cumulative Layout Shift (CLS)
		let clsValue = 0;
		let sessionValue = 0;
		let sessionEntries = [];

		this.observeMetric('layout-shift', (entries) => {
			for (const entry of entries) {
				// Only count layout shifts without recent input
				if (!entry.hadRecentInput) {
					const firstSessionEntry = sessionEntries[0];
					const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

					// If the entry occurred less than 1 second after the previous entry
					// and less than 5 seconds after the first entry, include it in the session
					if (sessionValue &&
						entry.startTime - lastSessionEntry.startTime < 1000 &&
						entry.startTime - firstSessionEntry.startTime < 5000) {
						sessionValue += entry.value;
						sessionEntries.push(entry);
					} else {
						sessionValue = entry.value;
						sessionEntries = [entry];
					}

					// Update CLS if this session is the largest so far
					if (sessionValue > clsValue) {
						clsValue = sessionValue;
						this.metrics.coreWebVitals.cls = {
							value: Math.round(clsValue * 1000) / 1000,
							timestamp: Date.now(),
							entries: sessionEntries.length
						};
						this.checkPerformanceBudget('cls', clsValue);
					}
				}
			}
		});

		// First Contentful Paint (FCP)
		this.observeMetric('paint', (entries) => {
			const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
			if (fcpEntry) {
				this.metrics.coreWebVitals.fcp = {
					value: Math.round(fcpEntry.startTime),
					timestamp: Date.now()
				};
				this.checkPerformanceBudget('fcp', fcpEntry.startTime);
			}
		});
	}

	observeMetric(entryType, callback) {
		try {
			const observer = new PerformanceObserver((list) => {
				callback(list.getEntries());
			});
			observer.observe({ entryTypes: [entryType] });
			this.observers.push(observer);
		} catch (error) {
			console.warn(`[Performance] Could not observe ${entryType}:`, error);
		}
	}

	trackPerformanceTiming() {
		// Wait for page load to complete
		window.addEventListener('load', () => {
			const timing = performance.getEntriesByType('navigation')[0];
			if (timing) {
				this.metrics.performanceTiming = {
					ttfb: Math.round(timing.responseStart - timing.fetchStart),
					domInteractive: Math.round(timing.domInteractive - timing.fetchStart),
					domContentLoaded: Math.round(timing.domContentLoadedEventEnd - timing.fetchStart),
					loadComplete: Math.round(timing.loadEventEnd - timing.fetchStart),
					redirectTime: Math.round(timing.redirectEnd - timing.redirectStart),
					dnsTime: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
					connectTime: Math.round(timing.connectEnd - timing.connectStart),
					requestTime: Math.round(timing.responseEnd - timing.requestStart),
					timestamp: Date.now()
				};

				this.checkPerformanceBudget('ttfb', this.metrics.performanceTiming.ttfb);
			}
		});
	}

	trackResourceMetrics() {
		// Track resource loading performance
		const resourceObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			entries.forEach(entry => {
				if (entry.entryType === 'resource') {
					const resourceMetric = {
						name: entry.name,
						type: this.getResourceType(entry.name),
						duration: Math.round(entry.duration),
						size: entry.transferSize || 0,
						cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
						timestamp: Date.now()
					};

					// Only track significant resources to avoid noise
					if (resourceMetric.duration > 50 || resourceMetric.size > 10000) {
						this.metrics.resourceMetrics.push(resourceMetric);

						// Keep only recent entries to prevent memory bloat
						if (this.metrics.resourceMetrics.length > this.options.bufferSize) {
							this.metrics.resourceMetrics = this.metrics.resourceMetrics.slice(-this.options.bufferSize);
						}
					}
				}
			});
		});

		resourceObserver.observe({ entryTypes: ['resource'] });
		this.observers.push(resourceObserver);
	}

	getResourceType(url) {
		if (url.match(/\.(css)$/i)) return 'stylesheet';
		if (url.match(/\.(js)$/i)) return 'script';
		if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
		if (url.match(/\.(woff|woff2|ttf|eot|otf)$/i)) return 'font';
		if (url.match(/\.(mp4|webm|ogg|mp3|wav|m4a)$/i)) return 'media';
		return 'other';
	}

	trackUserExperience() {
		let interactionCount = 0;
		let totalDelay = 0;

		// Track interaction delays
		['click', 'touchstart', 'keydown'].forEach(eventType => {
			document.addEventListener(eventType, (event) => {
				const startTime = performance.now();

				requestIdleCallback(() => {
					const delay = performance.now() - startTime;
					if (delay > 16) { // Only track delays > 1 frame
						interactionCount++;
						totalDelay += delay;

						this.metrics.userExperience.averageInteractionDelay = Math.round(totalDelay / interactionCount);
						this.metrics.userExperience.slowInteractions = (this.metrics.userExperience.slowInteractions || 0) + (delay > 100 ? 1 : 0);
					}
				});
			}, { passive: true });
		});

		// Track scroll performance
		let scrollCount = 0;
		let jankyScrolls = 0;
		let lastScrollTime = 0;

		window.addEventListener('scroll', () => {
			const now = performance.now();
			if (lastScrollTime > 0) {
				const timeDiff = now - lastScrollTime;
				scrollCount++;

				// Consider scroll janky if frame rate drops below 30fps
				if (timeDiff > 33) {
					jankyScrolls++;
				}
			}
			lastScrollTime = now;
		}, { passive: true });

		// Report scroll performance periodically
		setInterval(() => {
			if (scrollCount > 0) {
				this.metrics.userExperience.scrollPerformance = {
					jankyScrollPercentage: Math.round((jankyScrolls / scrollCount) * 100),
					totalScrollEvents: scrollCount,
					timestamp: Date.now()
				};
			}
		}, 10000);
	}

	trackMemoryUsage() {
		if ('memory' in performance) {
			const updateMemoryMetrics = () => {
				this.metrics.userExperience.memory = {
					usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
					totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
					jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
					timestamp: Date.now()
				};
			};

			updateMemoryMetrics();
			setInterval(updateMemoryMetrics, 15000); // Update every 15 seconds
		}
	}

	trackNetworkConditions() {
		if ('connection' in navigator) {
			const connection = navigator.connection;
			this.metrics.userExperience.network = {
				effectiveType: connection.effectiveType,
				downlink: connection.downlink,
				rtt: connection.rtt,
				saveData: connection.saveData,
				timestamp: Date.now()
			};

			// Listen for network changes
			connection.addEventListener('change', () => {
				this.metrics.userExperience.network = {
					...this.metrics.userExperience.network,
					effectiveType: connection.effectiveType,
					downlink: connection.downlink,
					rtt: connection.rtt,
					timestamp: Date.now()
				};
			});
		}
	}

	setupErrorTracking() {
		// Track JavaScript errors
		window.addEventListener('error', (event) => {
			this.metrics.errors.push({
				type: 'javascript',
				message: event.message,
				filename: event.filename,
				line: event.lineno,
				column: event.colno,
				timestamp: Date.now()
			});
		});

		// Track unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.metrics.errors.push({
				type: 'promise',
				message: event.reason?.toString() || 'Unhandled promise rejection',
				timestamp: Date.now()
			});
		});

		// Track resource loading errors
		document.addEventListener('error', (event) => {
			if (event.target !== window) {
				this.metrics.errors.push({
					type: 'resource',
					element: event.target.tagName,
					source: event.target.src || event.target.href,
					timestamp: Date.now()
				});
			}
		}, true);
	}

	checkPerformanceBudget(metric, value) {
		const budget = this.options.performanceBudget[metric];
		if (budget && value > budget) {
			const violation = {
				metric,
				value: Math.round(value),
				budget,
				exceededBy: Math.round(value - budget),
				timestamp: Date.now()
			};

			this.reportBudgetViolation(violation);

			if (this.options.enableConsoleLogging) {
				console.warn(`[Performance] Budget violation: ${metric} = ${value}ms (budget: ${budget}ms)`);
			}
		}
	}

	reportBudgetViolation(violation) {
		// Add to custom metrics for reporting
		if (!this.metrics.customMetrics.budgetViolations) {
			this.metrics.customMetrics.budgetViolations = [];
		}
		this.metrics.customMetrics.budgetViolations.push(violation);
	}

	trackVisibilityChange() {
		const isVisible = !document.hidden;
		this.metrics.userExperience.visibilityChanges = (this.metrics.userExperience.visibilityChanges || 0) + 1;
		this.metrics.userExperience.lastVisibilityChange = {
			visible: isVisible,
			timestamp: Date.now()
		};
	}

	startPeriodicReporting() {
		if (this.options.enableRealTimeReporting) {
			setInterval(() => {
				this.sendReport();
			}, this.options.reportInterval);
		}
	}

	sendReport() {
		const report = this.generateReport();

		if (Math.random() <= this.options.sampleRate) {
			this.reportBuffer.push(report);

			if (this.options.enableConsoleLogging) {
				console.log('[Performance] Report generated:', report);
			}

			// Send to endpoint if configured
			if (this.options.reportingEndpoint && navigator.sendBeacon) {
				try {
					navigator.sendBeacon(this.options.reportingEndpoint, JSON.stringify(report));
				} catch (error) {
					console.warn('[Performance] Failed to send report:', error);
				}
			}
		}
	}

	generateReport() {
		return {
			sessionId: this.sessionId,
			timestamp: Date.now(),
			url: window.location.pathname,
			userAgent: navigator.userAgent.substring(0, 100),
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			metrics: {
				...this.metrics,
				timeOnPage: Date.now() - this.pageLoadTime
			},
			performanceScore: this.calculatePerformanceScore()
		};
	}

	calculatePerformanceScore() {
		const weights = {
			lcp: 0.25,
			fid: 0.25,
			cls: 0.25,
			fcp: 0.15,
			ttfb: 0.1
		};

		let totalScore = 0;
		let totalWeight = 0;

		// Score LCP (0-100, where 100 is best)
		if (this.metrics.coreWebVitals.lcp) {
			const lcpScore = Math.max(0, 100 - (this.metrics.coreWebVitals.lcp.value / 40));
			totalScore += lcpScore * weights.lcp;
			totalWeight += weights.lcp;
		}

		// Score FID
		if (this.metrics.coreWebVitals.fid) {
			const fidScore = Math.max(0, 100 - (this.metrics.coreWebVitals.fid.value / 2));
			totalScore += fidScore * weights.fid;
			totalWeight += weights.fid;
		}

		// Score CLS
		if (this.metrics.coreWebVitals.cls) {
			const clsScore = Math.max(0, 100 - (this.metrics.coreWebVitals.cls.value * 1000));
			totalScore += clsScore * weights.cls;
			totalWeight += weights.cls;
		}

		// Score FCP
		if (this.metrics.coreWebVitals.fcp) {
			const fcpScore = Math.max(0, 100 - (this.metrics.coreWebVitals.fcp.value / 30));
			totalScore += fcpScore * weights.fcp;
			totalWeight += weights.fcp;
		}

		// Score TTFB
		if (this.metrics.performanceTiming.ttfb) {
			const ttfbScore = Math.max(0, 100 - (this.metrics.performanceTiming.ttfb / 10));
			totalScore += ttfbScore * weights.ttfb;
			totalWeight += weights.ttfb;
		}

		return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
	}

	finalReport() {
		// Send final report when page is unloading
		this.sendReport();
	}

	// Public API methods
	mark(name) {
		performance.mark(name);
	}

	measure(name, startMark, endMark) {
		try {
			performance.measure(name, startMark, endMark);
			const measure = performance.getEntriesByName(name, 'measure')[0];
			this.metrics.customMetrics[name] = {
				duration: Math.round(measure.duration),
				timestamp: Date.now()
			};
		} catch (error) {
			console.warn(`[Performance] Failed to measure ${name}:`, error);
		}
	}

	addCustomMetric(name, value, unit = 'ms') {
		this.metrics.customMetrics[name] = {
			value,
			unit,
			timestamp: Date.now()
		};
	}

	getMetrics() {
		return { ...this.metrics };
	}

	getPerformanceScore() {
		return this.calculatePerformanceScore();
	}

	// Clean up observers
	disconnect() {
		this.observers.forEach(observer => {
			try {
				observer.disconnect();
			} catch (error) {
				console.warn('[Performance] Error disconnecting observer:', error);
			}
		});
		this.observers = [];
	}
}

// Auto-initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
	// Only initialize if performance monitoring is enabled
	const isEnabled = !localStorage.getItem('nightdogs-disable-performance-monitoring');
	const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

	if (isEnabled) {
		window.performanceMonitor = new PerformanceMonitor({
			enableConsoleLogging: isDev,
			enableRealTimeReporting: !isDev,
			sampleRate: isDev ? 1.0 : 0.1 // 100% in dev, 10% in production
		});

		// Expose useful methods globally for debugging
		window.perfMark = (name) => window.performanceMonitor.mark(name);
		window.perfMeasure = (name, start, end) => window.performanceMonitor.measure(name, start, end);
		window.getPerformanceMetrics = () => window.performanceMonitor.getMetrics();
		window.getPerformanceScore = () => window.performanceMonitor.getPerformanceScore();

		if (isDev) {
			console.log('[Performance] Debug commands available:');
			console.log('- perfMark("name"): Add performance mark');
			console.log('- perfMeasure("name", "start", "end"): Measure between marks');
			console.log('- getPerformanceMetrics(): Get all metrics');
			console.log('- getPerformanceScore(): Get overall performance score');
		}
	}
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
	if (window.performanceMonitor) {
		window.performanceMonitor.disconnect();
	}
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = PerformanceMonitor;
}
