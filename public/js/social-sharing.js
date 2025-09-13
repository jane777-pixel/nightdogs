/**
 * Privacy-friendly social sharing for nightdogs.xyz
 * No tracking, uses native share API when available
 */

(function() {
    'use strict';

    class SocialSharing {
        constructor() {
            this.shareData = null;
            this.canNativeShare = navigator.share && navigator.canShare;
            this.init();
        }

        init() {
            this.collectShareData();
            this.setupShareButtons();
        }

        collectShareData() {
            // Get page data for sharing
            const titleElement = document.querySelector('h1, .post-title, title');
            const descriptionElement = document.querySelector('meta[name="description"]');
            const authorElement = document.querySelector('.post-author, [data-author]');

            this.shareData = {
                title: titleElement ? titleElement.textContent.trim() : document.title,
                url: window.location.href,
                description: descriptionElement ? descriptionElement.content : '',
                author: authorElement ? authorElement.textContent.trim() : ''
            };

            // Create share text
            const authorText = this.shareData.author ? ` by ${this.shareData.author}` : '';
            this.shareData.text = `"${this.shareData.title}"${authorText} - nightdogs.xyz`;
        }

        setupShareButtons() {
            // Find existing share containers or create them
            const shareContainers = document.querySelectorAll('.social-share, [data-social-share]');

            if (shareContainers.length === 0) {
                this.createDefaultShareSection();
            } else {
                shareContainers.forEach(container => this.populateShareContainer(container));
            }
        }

        createDefaultShareSection() {
            // Only create if we're on a post page
            const isPostPage = document.querySelector('.post-content, article[data-author]');
            if (!isPostPage) return;

            const shareSection = document.createElement('div');
            shareSection.className = 'social-share';
            shareSection.innerHTML = `
                <h4>Share this post</h4>
                <div class="share-buttons"></div>
            `;

            // Insert after post content or before webmentions
            const insertBefore = document.querySelector('#webmentions, .related-posts');
            const insertAfter = document.querySelector('.post-content, article');

            if (insertBefore) {
                insertBefore.parentNode.insertBefore(shareSection, insertBefore);
            } else if (insertAfter) {
                insertAfter.parentNode.insertBefore(shareSection, insertAfter.nextSibling);
            }

            this.populateShareContainer(shareSection);
        }

        populateShareContainer(container) {
            let buttonsContainer = container.querySelector('.share-buttons');
            if (!buttonsContainer) {
                buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'share-buttons';
                container.appendChild(buttonsContainer);
            }

            // Clear existing buttons
            buttonsContainer.innerHTML = '';

            // Native share button (mobile/progressive web app)
            if (this.canNativeShare) {
                const nativeButton = this.createShareButton({
                    label: 'Share',
                    icon: '📤',
                    className: 'native-share',
                    handler: () => this.handleNativeShare()
                });
                buttonsContainer.appendChild(nativeButton);
            }

            // Individual platform buttons
            const platforms = this.getSharingPlatforms();
            platforms.forEach(platform => {
                const button = this.createShareButton({
                    label: platform.name,
                    icon: platform.icon,
                    className: `share-${platform.key}`,
                    handler: () => this.handlePlatformShare(platform)
                });
                buttonsContainer.appendChild(button);
            });

            // Copy link button
            const copyButton = this.createShareButton({
                label: 'Copy Link',
                icon: '🔗',
                className: 'copy-link',
                handler: () => this.handleCopyLink()
            });
            buttonsContainer.appendChild(copyButton);
        }

        getSharingPlatforms() {
            const encodedUrl = encodeURIComponent(this.shareData.url);
            const encodedTitle = encodeURIComponent(this.shareData.title);
            const encodedText = encodeURIComponent(this.shareData.text);

            return [
                {
                    key: 'twitter',
                    name: 'Twitter',
                    icon: '🐦',
                    url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
                },
                {
                    key: 'mastodon',
                    name: 'Mastodon',
                    icon: '🦣',
                    // Generic Mastodon share - user will need to enter their instance
                    url: `https://mastodonshare.com/?text=${encodedText}&url=${encodedUrl}`,
                },
                {
                    key: 'email',
                    name: 'Email',
                    icon: '📧',
                    url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
                },
                {
                    key: 'reddit',
                    name: 'Reddit',
                    icon: '📱',
                    url: `https://www.reddit.com/submit?title=${encodedTitle}&url=${encodedUrl}`,
                },
            ];
        }

        createShareButton({ label, icon, className, handler }) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `share-button ${className}`;
            button.innerHTML = `<span class="share-icon" aria-hidden="true">${icon}</span><span class="share-label">${label}</span>`;
            button.title = `Share via ${label}`;
            button.addEventListener('click', handler);

            return button;
        }

        async handleNativeShare() {
            try {
                await navigator.share({
                    title: this.shareData.title,
                    text: this.shareData.text,
                    url: this.shareData.url
                });

                this.showFeedback('Shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Native share failed:', error);
                    this.showFeedback('Share cancelled', 'info');
                }
            }
        }

        handlePlatformShare(platform) {
            // Open in new window/tab
            const width = 550;
            const height = 450;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            const features = `width=${width},height=${height},left=${left},top=${top},resizable=1,scrollbars=1`;

            window.open(platform.url, `share-${platform.key}`, features);

            this.showFeedback(`Opening ${platform.name}...`, 'info');
        }

        async handleCopyLink() {
            try {
                await navigator.clipboard.writeText(this.shareData.url);
                this.showFeedback('Link copied to clipboard!', 'success');
            } catch (error) {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(this.shareData.url);
            }
        }

        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.showFeedback('Link copied to clipboard!', 'success');
                } else {
                    this.showFeedback('Copy failed. Please copy manually.', 'error');
                }
            } catch (error) {
                console.warn('Fallback copy failed:', error);
                this.showFeedback('Copy failed. Please copy manually.', 'error');
            }

            document.body.removeChild(textArea);
        }

        showFeedback(message, type = 'info') {
            // Create or update feedback element
            let feedback = document.querySelector('.share-feedback');

            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'share-feedback';
                feedback.setAttribute('aria-live', 'polite');

                // Find a good place to insert feedback
                const shareContainer = document.querySelector('.social-share');
                if (shareContainer) {
                    shareContainer.appendChild(feedback);
                } else {
                    document.body.appendChild(feedback);
                }
            }

            feedback.textContent = message;
            feedback.className = `share-feedback ${type}`;
            feedback.style.display = 'block';

            // Auto-hide after 3 seconds
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }

        // Public method to update share data (useful for SPAs)
        updateShareData(newData) {
            this.shareData = { ...this.shareData, ...newData };
            this.setupShareButtons();
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.nightdogsSocialSharing = new SocialSharing();
        } catch (error) {
            console.warn('Social sharing initialization failed:', error);
        }
    });

    // Re-initialize on page changes (for SPAs)
    window.addEventListener('popstate', () => {
        if (window.nightdogsSocialSharing) {
            window.nightdogsSocialSharing.collectShareData();
            window.nightdogsSocialSharing.setupShareButtons();
        }
    });

})();
