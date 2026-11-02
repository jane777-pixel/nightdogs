// Tap a photo in a post to see it full size, then swipe or use the arrow
// keys to move through the rest. Uses the native <dialog> element, so focus
// handling and the Escape key come for free.
(function () {
	const content = document.querySelector(".post .e-content");
	if (!content || typeof HTMLDialogElement === "undefined") return;

	const images = Array.from(content.querySelectorAll("img")).filter(
		(img) => !img.closest("a") && !img.closest(".webmentions"),
	);
	if (!images.length) return;

	content.setAttribute("data-lightbox-ready", "");

	// ---- Build the dialog once ---------------------------------------
	const dialog = document.createElement("dialog");
	dialog.className = "lightbox";
	dialog.setAttribute("aria-label", "Photo viewer");
	dialog.innerHTML = `
		<div class="lightbox__bar">
			<span class="lightbox__count" aria-live="polite"></span>
			<button type="button" class="lightbox__close" aria-label="Close">✕</button>
		</div>
		<div class="lightbox__stage">
			<button type="button" class="lightbox__prev" aria-label="Previous photo">‹</button>
			<img alt="">
			<button type="button" class="lightbox__next" aria-label="Next photo">›</button>
		</div>
		<p class="lightbox__caption"></p>`;
	document.body.append(dialog);

	const view = dialog.querySelector(".lightbox__stage img");
	const count = dialog.querySelector(".lightbox__count");
	const caption = dialog.querySelector(".lightbox__caption");
	const prev = dialog.querySelector(".lightbox__prev");
	const next = dialog.querySelector(".lightbox__next");
	let index = 0;
	let opener = null;

	// Pick the largest version the image transform generated
	function bestSource(img) {
		const picture = img.closest("picture");
		const candidates = [];
		const collect = (srcset) =>
			(srcset || "").split(",").forEach((entry) => {
				const [url, size] = entry.trim().split(/\s+/);
				if (url) candidates.push({ url, width: parseInt(size, 10) || 0 });
			});
		if (picture) {
			picture.querySelectorAll("source").forEach((source) => {
				if (/webp|avif/.test(source.type) || !source.type) collect(source.srcset);
			});
		}
		collect(img.getAttribute("srcset"));
		candidates.sort((a, b) => b.width - a.width);
		return candidates[0]?.url || img.currentSrc || img.src;
	}

	function captionFor(img) {
		const figure = img.closest("figure");
		const figcaption = figure && figure.querySelector("figcaption");
		return (figcaption && figcaption.textContent.trim()) || img.title || "";
	}

	function show(i) {
		index = (i + images.length) % images.length;
		const img = images[index];
		view.src = bestSource(img);
		view.alt = img.alt || "";
		caption.textContent = captionFor(img);
		count.textContent = images.length > 1 ? `${index + 1} / ${images.length}` : "";
		prev.hidden = next.hidden = images.length < 2;
		// Warm up the neighbours so swiping feels instant
		[index + 1, index - 1].forEach((n) => {
			const neighbour = images[(n + images.length) % images.length];
			if (neighbour) new Image().src = bestSource(neighbour);
		});
	}

	function open(i, from) {
		opener = from;
		show(i);
		dialog.showModal();
		document.documentElement.style.overflow = "hidden";
	}

	dialog.addEventListener("close", () => {
		document.documentElement.style.overflow = "";
		view.removeAttribute("src");
		if (opener) opener.focus();
	});

	// ---- Make each photo a button ------------------------------------
	images.forEach((img, i) => {
		img.tabIndex = 0;
		img.setAttribute("role", "button");
		const label = img.alt ? `View photo: ${img.alt}` : `View photo ${i + 1} of ${images.length}`;
		img.setAttribute("aria-label", label);
		img.addEventListener("click", () => open(i, img));
		img.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				open(i, img);
			}
		});
	});

	// ---- Controls ----------------------------------------------------
	dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());
	prev.addEventListener("click", () => show(index - 1));
	next.addEventListener("click", () => show(index + 1));

	dialog.addEventListener("keydown", (event) => {
		if (event.key === "ArrowLeft") show(index - 1);
		else if (event.key === "ArrowRight") show(index + 1);
	});

	// Click on the dark background (not the photo or buttons) closes it
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog || event.target.classList.contains("lightbox__stage")) {
			dialog.close();
		}
	});

	// Swipe left/right to move, swipe down to close
	let startX = 0;
	let startY = 0;
	dialog.addEventListener(
		"touchstart",
		(event) => {
			if (event.touches.length !== 1) return;
			startX = event.touches[0].clientX;
			startY = event.touches[0].clientY;
		},
		{ passive: true },
	);
	dialog.addEventListener(
		"touchend",
		(event) => {
			const touch = event.changedTouches[0];
			const dx = touch.clientX - startX;
			const dy = touch.clientY - startY;
			if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
				show(index + (dx < 0 ? 1 : -1));
			} else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
				dialog.close();
			}
		},
		{ passive: true },
	);
})();
