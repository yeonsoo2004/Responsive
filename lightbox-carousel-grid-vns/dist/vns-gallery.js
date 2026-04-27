/*!
 * VNS.Gallery - jQuery Plugin
 * @version 1.0.6
 * @author Martin H. Schläger
 * @license MIT
 * @repository https://github.com/schlagerdk/VNS.Gallery
 *
 * Copyright (c) 2025-present Vital New Software ApS
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * VNS.Gallery - jQuery Plugin
 * Version: 1.0.6
 * A flexible image gallery plugin with thumbnails, lightbox, and grid view
 */
(function ($) {
	'use strict';

	// Plugin defaults
	var defaults = {
		// Thumbnail carousel options
		useCarousel: true,              // Use carousel navigation (if false, shows static grid)
		loop: false,                    // Enable looping through images
		step: null,                     // Number of items to step (null = auto based on visible items)
		showAllButton: true,            // Show "See all" button

		// Static grid options (when useCarousel is false)
		maxImages: null,                // Max images to show initially (null = show all)
		showMoreIndicator: true,        // Show "..." indicator when images are hidden
		moreIndicatorAction: 'modal',   // Action on click: 'modal' (open gallery) or 'load' (load more images)
		moreIndicatorText: '...',       // Text for the more indicator

		// Navigation options
		showNavigation: true,           // Show prev/next arrows in lightbox
		showCounter: true,              // Show image counter
		showCloseButtonGrid: true,      // Show close (X) button in grid view
		showCloseButtonSingle: true,    // Show close (X) button in single view
		enableKeyboard: true,           // Enable keyboard navigation
		enableDrag: true,               // Enable mouse/touch drag on carousel
		dragThreshold: 50,              // Minimum drag distance (in pixels) to trigger navigation
		hoverEffect: false,             // Enable hover effect on thumbnails and more indicator

		// Caption options
		captions: false,                 // Show captions if available
		captionSelector: 'img',         // Element to get caption from: 'img' or 'self' (the container)
		captionType: 'attr',            // How to get caption: 'attr', 'data', or 'text'
		captionsData: 'alt',            // Attribute name to get caption from (e.g., 'title', 'alt')
		captionPosition: 'outside-center', // Caption position: 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'outside-left', 'outside-center', 'outside-right'
		captionDelay: 0,                // Delay before showing caption (in ms)

		// Text labels
		showAllText: 'Show all',
		prevText: '◀',
		nextText: '▶',
		thumbPrevText: '‹',
		thumbNextText: '›',

		// Grid layout
		columns: null,              // Number of columns in front carousel (null = use responsive default: 2/3/4)
		modalColumns: 4,            // Number of columns in modal grid view
		modalWidth: '80vw',         // Width of modal in single view (e.g., '80vw', '1200px', '90%')

		// Responsive option (like Owl Carousel)
		// Define different settings for different screen widths
		// Set to null to disable, or provide breakpoint object
		responsive: null,

		// Event callbacks
		onShow: function() {},          // Before lightbox opens
		onShown: function() {},         // After lightbox opens
		onChange: function() {},        // Before image changes
		onChanged: function() {},       // After image changes
		onClose: function() {},         // Before lightbox closes
		onClosed: function() {},        // After lightbox closes
		onNext: function() {},          // Before next image
		onNextDone: function() {},      // After next image
		onPrev: function() {},          // Before previous image
		onPrevDone: function() {},      // After previous image
		onError: function() {}          // On image load error
	};

	// Plugin constructor
	function vnsGallery(element, options) {
		this.element = element;
		this.$element = $(element);
		this.options = $.extend(true, {}, defaults, options);
		this.instanceId = 'vnsGallery_' + Math.random().toString(36).substr(2, 9);

		this.images = [];
		this.currentIndex = 0;
		this.thumbPosition = 0;
		this.itemsPerPage = 0;
		this.maxPosition = 0;
		this.modal = null;
		this.resizeTimeout = null;
		this.loopItemCount = 0;
		this.hasInfiniteThumbLoop = false;
		this.loopNormalizeTimeout = null;

	// Drag/swipe state
	this.dragState = {
		isDragging: false,
		isModalDrag: false,
		startX: 0,
		startY: 0,
		currentX: 0,
		currentTranslate: 0,
		prevTranslate: 0,
		animationID: null
	};		this.init();
	}

	// Plugin methods
	vnsGallery.prototype = {
		init: function() {
			// Get images from container
			this.collectImages();

			// Apply responsive settings
			this.applyResponsiveSettings();

		// Build HTML structure
		this.buildHTML();

		// Initialize carousel (only if using carousel)
		if (this.options.useCarousel) {
			this.initCarousel();
		}

		// Bind events
		this.bindEvents();			// Trigger custom event
			this.$element.trigger('init');
		},

	collectImages: function() {
		var self = this;
		this.images = [];

		this.$element.find('img').each(function() {
			var $img = $(this);
			var $parent = $img.parent();

			// Get caption based on options
			var caption = '';
			if (self.options.captions) {
				var $captionElement = self.options.captionSelector === 'self' ? $parent : $img;

				if (self.options.captionType === 'data') {
					caption = $captionElement.data(self.options.captionsData) || '';
				} else if (self.options.captionType === 'text') {
					caption = $captionElement.text() || '';
				} else { // 'attr'
					caption = $captionElement.attr(self.options.captionsData) || '';
				}
			}

			self.images.push({
				src: $img.attr('src'),
				fullsize: $img.attr('data-fullsize') || $img.attr('src'),
				alt: $img.attr('alt') || '',
				title: $img.attr('title') || '',
				caption: caption
			});
		});
	},	buildHTML: function() {
		var self = this;

		// Clear original content
		this.$element.empty();

		// Add container class
		this.$element.addClass('vns-gallery-container');

		// Add hover effect class if enabled
		if (this.options.hoverEffect) {
			this.$element.addClass('vns-gallery-hover-enabled');
		}

	if (this.options.useCarousel) {
		// Build thumbnail carousel
		// Use responsive columns if set, otherwise explicit columns option
		var columns = this.currentResponsiveColumns || this.options.columns || null;
		var columnsAttr = columns ? ' data-columns="' + columns + '"' : '';
		var carouselHTML = '<div class="vns-gallery-thumbnail-carousel-container mt-4"' + columnsAttr + '>';
		carouselHTML += '<div class="vns-gallery-thumbnail-header">';
		carouselHTML += '<div class="vns-gallery-thumbnail-nav-controls">';			if (this.options.showAllButton) {
				carouselHTML += '<button class="vns-gallery-see-all-btn">' + this.options.showAllText + '</button>';
			}

			carouselHTML += '<button class="vns-gallery-carousel-nav vns-gallery-thumb-prev">' + this.options.thumbPrevText + '</button>';
			carouselHTML += '<button class="vns-gallery-carousel-nav vns-gallery-thumb-next">' + this.options.thumbNextText + '</button>';
			carouselHTML += '</div></div>';
			carouselHTML += '<div class="vns-gallery-thumbnail-carousel-wrapper">';
			carouselHTML += '<div class="vns-gallery-thumbnail-carousel">';

			// Add thumbnail items
			$.each(this.images, function(index, image) {
				carouselHTML += '<div class="vns-gallery-thumbnail-item">';
				carouselHTML += '<img src="' + image.src + '" class="vns-gallery-thumbnail-img" alt="' + image.alt + '" data-index="' + index + '">';
				carouselHTML += '</div>';
			});

			carouselHTML += '</div></div></div>';
			this.$element.append(carouselHTML);
		} else {
		// Build static grid
		var columns = this.options.columns || 4;
		var gridHTML = '<div class="vns-gallery-static-grid" data-columns="' + columns + '">';			var maxImages = this.options.maxImages;
			var totalImages = this.images.length;
			var imagesToShow = (maxImages && maxImages < totalImages) ? maxImages : totalImages;
			var hasMore = maxImages && totalImages > maxImages;

			// Add images
			$.each(this.images, function(index, image) {
				if (index < imagesToShow) {
					gridHTML += '<div class="vns-gallery-static-item">';
					gridHTML += '<img src="' + image.src + '" class="vns-gallery-thumbnail-img" alt="' + image.alt + '" data-index="' + index + '">';
					gridHTML += '</div>';
				}
			});

			// Add "more" indicator if needed
			if (hasMore && this.options.showMoreIndicator) {
				gridHTML += '<div class="vns-gallery-static-item vns-gallery-more-indicator">';
				gridHTML += '<div class="vns-gallery-more-indicator-content">' + this.options.moreIndicatorText + '</div>';
				gridHTML += '</div>';
			}

			gridHTML += '</div>';
			this.$element.append(gridHTML);
		}

		// Build lightbox modal
		var modalId = 'vnsGalleryModal-' + this.generateId();
		var modalHTML = '<div id="' + modalId + '" class="vns-gallery-modal" tabindex="-1" role="dialog">';
		modalHTML += '<div class="vns-gallery-modal-dialog">';
		modalHTML += '<div class="vns-gallery-modal-content">';
		// Close button for grid view
		if (this.options.showCloseButtonGrid) {
			modalHTML += '<button class="vns-gallery-modal-close vns-gallery-close-grid" aria-label="Close">&times;</button>';
		}
		// Close button for single view
		if (this.options.showCloseButtonSingle) {
			modalHTML += '<button class="vns-gallery-modal-close vns-gallery-close-single" style="display: none;" aria-label="Close">&times;</button>';
		}
		modalHTML += '<div class="vns-gallery-modal-body">';			// Grid view
			modalHTML += '<div class="vns-gallery-grid"></div>';

			// Single image view
			modalHTML += '<div class="vns-gallery-single-container" style="display: none; width: ' + this.options.modalWidth + ';">';
			modalHTML += '<div class="vns-gallery-single">';
			modalHTML += '<div class="vns-gallery-lightbox-header">';

			if (this.options.showCounter) {
				modalHTML += '<div class="vns-gallery-lightbox-counter">1 / ' + this.images.length + '</div>';
			}

			modalHTML += '<div class="vns-gallery-lightbox-controls">';

			if (this.options.showAllButton) {
				modalHTML += '<button class="vns-gallery-show-all-btn">' + this.options.showAllText + '</button>';
			}

			if (this.options.showNavigation) {
				modalHTML += '<button class="vns-gallery-prev-btn">' + this.options.prevText + '</button>';
				modalHTML += '<button class="vns-gallery-next-btn">' + this.options.nextText + '</button>';
			}

			modalHTML += '</div></div>';

			// Image wrapper for overlays
			modalHTML += '<div class="vns-gallery-image-wrapper">';

			// Loading spinner
			modalHTML += '<div class="vns-gallery-loading">';
			modalHTML += '<div class="vns-gallery-spinner"></div>';
			modalHTML += '</div>';

			modalHTML += '<img class="vns-gallery-single-img" src="" alt="" style="max-height: 75vh; border-radius: 8px;">';

			// Caption overlays (top and bottom)
			if (this.options.captions && this.options.captionPosition.startsWith('top')) {
				var topClass = 'vns-gallery-caption-' + this.options.captionPosition;
				modalHTML += '<div class="vns-gallery-caption ' + topClass + '" style="display: none;"></div>';
			}
			if (this.options.captions && this.options.captionPosition.startsWith('bottom')) {
				var bottomClass = 'vns-gallery-caption-' + this.options.captionPosition;
				modalHTML += '<div class="vns-gallery-caption ' + bottomClass + '" style="display: none;"></div>';
			}

			modalHTML += '</div>';

			// Caption outside (below image wrapper)
			if (this.options.captions && this.options.captionPosition.startsWith('outside')) {
				var outsideClass = 'vns-gallery-caption-' + this.options.captionPosition;
				modalHTML += '<div class="vns-gallery-caption ' + outsideClass + '" style="display: none;"></div>';
			}

			modalHTML += '</div></div>';

			modalHTML += '</div></div></div>';

			this.$element.append(modalHTML);

			// Store modal reference
			this.$modal = $('#' + modalId);
		this.modalId = modalId;

		// Add grid images
		var $grid = this.$modal.find('.vns-gallery-grid');
		var modalColumns = this.options.modalColumns;
		$grid.attr('data-columns', modalColumns);
		// Apply modalWidth to grid container if specified
		if (this.options.modalWidth) {
			$grid.css('max-width', this.options.modalWidth);
		}
		$.each(this.images, function(index, image) {
			$grid.append('<div class="col-auto"><img src="' + image.src + '" class="vns-gallery-grid-img" alt="' + image.alt + '" data-index="' + index + '"></div>');
		});
	},		initCarousel: function() {
			this.itemsPerPage = this.getItemsPerPage();
			this.totalItems = this.images.length;
			this.maxPosition = Math.max(0, this.totalItems - this.itemsPerPage);
			this.setupInfiniteThumbLoop();
			// Avoid visible initial slide when loop starts at cloned offset.
			this.updateCarousel(true);
			this.updateButtonVisibility();
		},

	setupInfiniteThumbLoop: function() {
		var $carousel = this.$element.find('.vns-gallery-thumbnail-carousel');

		this.hasInfiniteThumbLoop = false;
		this.loopItemCount = 0;

		if (!this.options.loop || !this.options.useCarousel || this.totalItems <= this.itemsPerPage) {
			this.thumbPosition = Math.min(this.thumbPosition, this.maxPosition);
			return;
		}

		var $originalItems = $carousel.children('.vns-gallery-thumbnail-item').not('[data-vns-clone="1"]');
		if (!$originalItems.length) return;

		var $beforeClones = $originalItems.clone();
		var $afterClones = $originalItems.clone();
		$beforeClones.attr('data-vns-clone', '1');
		$afterClones.attr('data-vns-clone', '1');

		$carousel.prepend($beforeClones);
		$carousel.append($afterClones);

		this.hasInfiniteThumbLoop = true;
		this.loopItemCount = this.totalItems;
		this.thumbPosition = this.loopItemCount;
	},

getItemsPerPage: function() {
	// Priority: 1) currentResponsiveColumns, 2) explicit columns option, 3) responsive default based on width, 4) fallback to 4
	if (this.currentResponsiveColumns !== undefined) {
		return this.currentResponsiveColumns;
	}
	if (this.options.columns !== null) {
		return this.options.columns;
	}
	// Default responsive behavior if no columns or responsive set
	var width = $(window).width();
	if (width >= 1024) return 4;
	if (width >= 768) return 3;
	return 2;
},

applyResponsiveSettings: function() {
	if (!this.options.responsive) return;		var width = $(window).width();
		var breakpoints = [];

		// Get all breakpoints and sort them
		for (var bp in this.options.responsive) {
			if (this.options.responsive.hasOwnProperty(bp)) {
				breakpoints.push(parseInt(bp));
			}
		}
		breakpoints.sort(function(a, b) { return a - b; });

		// Find the active breakpoint
		var activeBreakpoint = 0;
		for (var i = 0; i < breakpoints.length; i++) {
			if (width >= breakpoints[i]) {
				activeBreakpoint = breakpoints[i];
			}
		}

		// Apply settings from active breakpoint
		var responsiveSettings = this.options.responsive[activeBreakpoint];
		if (responsiveSettings) {
			// Store responsive columns
			if (responsiveSettings.columns !== undefined) {
				this.currentResponsiveColumns = responsiveSettings.columns;
			}
			// You can extend this to support other responsive options like:
			// loop, showNavigation, etc.
		}
	},		getStepSize: function() {
			return this.options.step !== null ? this.options.step : this.itemsPerPage;
		},

	updateCarousel: function(disableTransition) {
		var $carousel = this.$element.find('.vns-gallery-thumbnail-carousel');
		if (disableTransition) {
			$carousel.addClass('vns-gallery-no-transition');
		}
		var percentage = -(this.thumbPosition * (100 / this.itemsPerPage));
		$carousel.css('transform', 'translateX(' + percentage + '%)');
		if (disableTransition) {
			$carousel[0].offsetHeight;
			$carousel.removeClass('vns-gallery-no-transition');
		}
	},	updateButtonVisibility: function() {
		var $prevBtn = this.$element.find('.vns-gallery-thumb-prev');
		var $nextBtn = this.$element.find('.vns-gallery-thumb-next');
		var $seeAllBtn = this.$element.find('.vns-gallery-see-all-btn');
		var $showAllBtn = this.$modal.find('.vns-gallery-show-all-btn');

		if (this.totalItems <= this.itemsPerPage) {
			$prevBtn.hide();
			$nextBtn.hide();
			if (this.options.showAllButton) {
				$seeAllBtn.hide();
				$showAllBtn.hide();
			}
		} else {
			$prevBtn.show();
			$nextBtn.show();
			if (this.options.showAllButton) {
				$seeAllBtn.show();
				$showAllBtn.show();
			}

			// Disable buttons at boundaries (unless loop is enabled)
			if (!this.options.loop) {
				var prevDisabled = this.thumbPosition <= 0;
				var nextDisabled = this.thumbPosition >= this.maxPosition;
				$prevBtn.prop('disabled', prevDisabled);
				$nextBtn.prop('disabled', nextDisabled);
			} else {
				$prevBtn.prop('disabled', false);
				$nextBtn.prop('disabled', false);
			}
		}
	},		bindEvents: function() {
			var self = this;
			var namespace = '.' + this.instanceId;

			// Unbind previous events
			this.$element.off(namespace);

			// Thumbnail prev button
			this.$element.on('click' + namespace, '.vns-gallery-thumb-prev', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.thumbPrev();
			});

			// Thumbnail next button
			this.$element.on('click' + namespace, '.vns-gallery-thumb-next', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.thumbNext();
			});

			// See all button (in carousel)
			this.$element.on('click', '.vns-gallery-see-all-btn', function() {
				console.log('🔘 See all button (carousel) clicked');
				self.openGrid();
			});

		// Thumbnail click (carousel and static grid)
		this.$element.on('click', '.vns-gallery-thumbnail-img', function() {
			var index = $(this).data('index');
			console.log('🖼️  Thumbnail clicked, index:', index);
			self.openSingle(index);
		});

		// More indicator click (static grid)
		this.$element.on('click', '.vns-gallery-more-indicator', function() {
			if (self.options.moreIndicatorAction === 'modal') {
				self.openGrid();
			} else if (self.options.moreIndicatorAction === 'load') {
				self.loadMoreImages();
			}
		});			// Grid image click
			this.$modal.on('click', '.vns-gallery-grid-img', function() {
				var index = $(this).data('index');
				console.log('🖼️  Grid image clicked, index:', index);
				self.currentIndex = index;
				self.showSingleImage();
			});

			// Navigation buttons
			this.$modal.on('click', '.vns-gallery-prev-btn', function() {
				self.prev();
			});

			this.$modal.on('click', '.vns-gallery-next-btn', function() {
				self.next();
			});

			// Show all button (in lightbox)
			this.$modal.on('click', '.vns-gallery-show-all-btn', function() {
				console.log('🔘 Show all button (lightbox) clicked');
				self.showGrid();
			});

			// Window resize
			$(window).on('resize.vnsGallery-' + this.modalId, function() {
				clearTimeout(self.resizeTimeout);
				self.resizeTimeout = setTimeout(function() {
					self.handleResize();
				}, 100);
			});

		// Keyboard navigation
		if (this.options.enableKeyboard) {
			$(document).on('keydown.vnsGallery-' + this.modalId, function(e) {
				if (!self.$modal.hasClass('vns-gallery-open')) return;					if (e.key === 'ArrowLeft') {
						e.preventDefault();
						self.prev();
					} else if (e.key === 'ArrowRight') {
						e.preventDefault();
						self.next();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						self.close();
					}
				});
			}

			// Modal close button
			this.$modal.find('.vns-gallery-modal-close').on('click', function() {
				console.log('❌ Close button clicked');
				self.close();
			});

		// Click backdrop to close
		this.$modal.on('click', function(e) {
			if ($(e.target).hasClass('vns-gallery-modal')) {
				console.log('❌ Backdrop clicked');
				self.close();
			}
		});

		// Touch/Drag events for carousel
		if (this.options.enableDrag && this.options.useCarousel) {
			this.bindDragEvents();
		}

		// Touch/Drag events for modal single image view
		if (this.options.enableDrag) {
			this.bindModalDragEvents();
		}
	},	thumbPrev: function() {
		var stepSize = this.getStepSize();
		this.thumbPosition -= stepSize;

		if (this.hasInfiniteThumbLoop) {
			this.updateCarousel();
			this.normalizeInfiniteThumbPosition();
			this.updateButtonVisibility();
			return;
		}

		if (this.thumbPosition < 0) {
			if (this.options.loop) {
				// When wrapping backwards, always go to maxPosition
				this.thumbPosition = this.maxPosition;
			} else {
				this.thumbPosition = Math.max(0, this.thumbPosition);
			}
		}

		this.updateCarousel();
		this.updateButtonVisibility();
	},

	thumbNext: function() {
		var stepSize = this.getStepSize();
		var beforePos = this.thumbPosition;
		this.thumbPosition += stepSize;

		if (this.hasInfiniteThumbLoop) {
			this.updateCarousel();
			this.normalizeInfiniteThumbPosition();
			this.updateButtonVisibility();
			return;
		}

		// Check if we need to adjust for step size vs maxPosition
		if (this.thumbPosition > this.maxPosition) {
			if (this.options.loop) {
				// If step would skip over maxPosition, go to maxPosition first if not visited
				if (beforePos < this.maxPosition && this.thumbPosition > this.maxPosition) {
					this.thumbPosition = this.maxPosition;
				} else {
					this.thumbPosition = 0;
				}
			} else {
				// Clamp to maxPosition
				this.thumbPosition = Math.min(this.maxPosition, this.thumbPosition);
			}
		}

			this.updateCarousel();
			this.updateButtonVisibility();
		},

	normalizeInfiniteThumbPosition: function() {
		var self = this;

		if (!this.hasInfiniteThumbLoop) return;
		if (this.loopNormalizeTimeout) {
			clearTimeout(this.loopNormalizeTimeout);
		}

		this.loopNormalizeTimeout = setTimeout(function() {
			if (!self.hasInfiniteThumbLoop) return;

			var min = self.loopItemCount;
			var maxExclusive = self.loopItemCount * 2;
			var position = self.thumbPosition;

			while (position >= maxExclusive) {
				position -= self.loopItemCount;
			}

			while (position < min) {
				position += self.loopItemCount;
			}

			if (position !== self.thumbPosition) {
				self.thumbPosition = position;
				self.updateCarousel(true);
			}
		}, 320);
	},

	handleResize: function() {
		// Store previous responsive columns
		var previousColumns = this.currentResponsiveColumns;

		// Reapply responsive settings
		this.applyResponsiveSettings();

		// Check if responsive columns changed - if so, rebuild HTML
		if (this.options.useCarousel && previousColumns !== this.currentResponsiveColumns) {
			// Rebuild carousel with new columns
			this.buildHTML();
			this.initCarousel();
			return; // initCarousel will handle all updates
		}

		// Update data-columns attribute on carousel if using responsive
		if (this.options.columns === null && this.currentResponsiveColumns) {
			var $carousel = this.$element.find('.vns-gallery-thumbnail-carousel-container');
			if ($carousel.length) {
				$carousel.attr('data-columns', this.currentResponsiveColumns);
			}
		}

		this.itemsPerPage = this.getItemsPerPage();
		this.maxPosition = Math.max(0, this.totalItems - this.itemsPerPage);
		if (!this.hasInfiniteThumbLoop) {
			this.thumbPosition = Math.min(this.thumbPosition, this.maxPosition);
		}
		this.updateCarousel();
		this.updateButtonVisibility();
	},	openGrid: function() {
		console.log('=== openGrid() called ===');
		this.showGrid();
		this.showModal();
	},	openSingle: function(index) {
		console.log('=== openSingle() called, index:', index, '===');
		this.currentIndex = index;
		this.showModal();
		this.showSingleImage();
	},	showGrid: function() {
		console.log('--- showGrid() called ---');
		var $grid = this.$modal.find('.vns-gallery-grid');
		var $dialog = this.$modal.find('.vns-gallery-modal-dialog');
		var $body = this.$modal.find('.vns-gallery-modal-body');

		console.log('BEFORE showGrid:');
		console.log('  Grid width:', $grid.css('width'), 'max-width:', $grid.css('max-width'));
		console.log('  Dialog width:', $dialog.css('width'));
		console.log('  Body width:', $body.css('width'));

		this.$modal.find('.vns-gallery-single-container').hide();
		// Use .css() to force display: flex instead of .show() which sets display: block
		this.$modal.find('.vns-gallery-grid').css('display', 'flex');
		// Toggle close buttons
		this.$modal.find('.vns-gallery-close-grid').show();
		this.$modal.find('.vns-gallery-close-single').hide();

		setTimeout(function() {
			console.log('AFTER showGrid (with setTimeout):');
			console.log('  Grid width:', $grid.css('width'), 'max-width:', $grid.css('max-width'));
			console.log('  Dialog width:', $dialog.css('width'));
			console.log('  Body width:', $body.css('width'));
			console.log('  Grid display:', $grid.css('display'));
		}, 50);
	},	showSingleImage: function() {
		var self = this;
		console.log('--- showSingleImage() called, index:', this.currentIndex, '---');

		var $grid = this.$modal.find('.vns-gallery-grid');
		var $single = this.$modal.find('.vns-gallery-single-container');
		var $dialog = this.$modal.find('.vns-gallery-modal-dialog');
		var $body = this.$modal.find('.vns-gallery-modal-body');

		console.log('BEFORE showSingleImage:');
		console.log('  Grid width:', $grid.css('width'));
		console.log('  Single width:', $single.css('width'));
		console.log('  Dialog width:', $dialog.css('width'));
		console.log('  Body width:', $body.css('width'));

		this.$modal.find('.vns-gallery-grid').hide();
		this.$modal.find('.vns-gallery-single-container').show();
	// Toggle close buttons
	this.$modal.find('.vns-gallery-close-grid').hide();
	this.$modal.find('.vns-gallery-close-single').show();

		setTimeout(function() {
			console.log('AFTER showSingleImage (with setTimeout):');
			console.log('  Grid width:', $grid.css('width'));
			console.log('  Single width:', $single.css('width'));
			console.log('  Dialog width:', $dialog.css('width'));
			console.log('  Body width:', $body.css('width'));
		}, 50);		var image = this.images[this.currentIndex];

		// Show loading spinner
		var $img = this.$modal.find('.vns-gallery-single-img');
		var $loading = this.$modal.find('.vns-gallery-loading');

		$loading.addClass('vns-gallery-active');
		$img.addClass('vns-gallery-loading-img');

		// Create new image to preload
		var newImg = new Image();

		newImg.onload = function() {
			// Hide loading spinner when image is loaded
			$loading.removeClass('vns-gallery-active');
			$img.removeClass('vns-gallery-loading-img');
		};

		newImg.onerror = function() {
			// Hide loading spinner even on error
			$loading.removeClass('vns-gallery-active');
			$img.removeClass('vns-gallery-loading-img');
			self.options.onError.call(self, self.currentIndex, image);
		};

		// Start loading the image
		newImg.src = image.fullsize;

		// Use fullsize image in single view, thumbnail in grid
		$img.attr('src', image.fullsize).attr('alt', image.alt);

			if (this.options.showCounter) {
				this.$modal.find('.vns-gallery-lightbox-counter').text((this.currentIndex + 1) + ' / ' + this.images.length);
			}

			// Update caption
			this.updateCaption();

			// Update modal navigation button disabled state
			this.updateModalNavigation();

			this.options.onChanged.call(this, this.currentIndex, image);
			this.$element.trigger('changed', [this.currentIndex, image]);
		},

	updateCaption: function() {
		var self = this;
		var image = this.images[this.currentIndex];
		var captionClass = '.vns-gallery-caption-' + this.options.captionPosition;
		var $caption = this.$modal.find(captionClass);

		if (this.options.captions && image.caption) {
			$caption.text(image.caption);

			if (this.options.captionDelay > 0) {
				$caption.hide();
				setTimeout(function() {
					$caption.fadeIn(300);
				}, this.options.captionDelay);
			} else {
				$caption.show();
			}
		} else {
			$caption.hide();
		}
	},		updateModalNavigation: function() {
			if (!this.options.loop) {
				var $prevBtn = this.$modal.find('.vns-gallery-prev-btn');
				var $nextBtn = this.$modal.find('.vns-gallery-next-btn');

				// Disable prev button if at first image
				$prevBtn.prop('disabled', this.currentIndex === 0);

				// Disable next button if at last image
				$nextBtn.prop('disabled', this.currentIndex === this.images.length - 1);
			}
		},

		// Public methods
		open: function(index) {
			if (typeof index !== 'undefined') {
				this.openSingle(index);
			} else {
				this.openGrid();
			}
	},

	showModal: function() {
		var self = this;
		console.log('>>> showModal() called <<<');

		var $grid = this.$modal.find('.vns-gallery-grid');
		var $single = this.$modal.find('.vns-gallery-single-container');
		var $dialog = this.$modal.find('.vns-gallery-modal-dialog');
		var $body = this.$modal.find('.vns-gallery-modal-body');

		console.log('Modal state on showModal:');
		console.log('  Grid display:', $grid.css('display'), 'width:', $grid.css('width'));
		console.log('  Single display:', $single.css('display'), 'width:', $single.css('width'));
		console.log('  Dialog width:', $dialog.css('width'));
		console.log('  Body width:', $body.css('width'));

		this.options.onShow.call(this);
		this.$element.trigger('show');

		this.$modal.addClass('vns-gallery-open');
		$('body').addClass('vns-gallery-no-scroll');

		setTimeout(function() {
			self.options.onShown.call(self);
			self.$element.trigger('shown');
		}, 150);
	},

	hideModal: function() {
		var self = this;
		console.log('<<< hideModal() called >>>');

		var $grid = this.$modal.find('.vns-gallery-grid');
		var $single = this.$modal.find('.vns-gallery-single-container');
		var $dialog = this.$modal.find('.vns-gallery-modal-dialog');
		var $body = this.$modal.find('.vns-gallery-modal-body');

		console.log('Modal state BEFORE hiding:');
		console.log('  Grid display:', $grid.css('display'), 'width:', $grid.css('width'));
		console.log('  Single display:', $single.css('display'), 'width:', $single.css('width'));
		console.log('  Dialog width:', $dialog.css('width'));
		console.log('  Body width:', $body.css('width'));

		this.options.onClose.call(this);
		this.$element.trigger('close');

		this.$modal.removeClass('vns-gallery-open');
		$('body').removeClass('vns-gallery-no-scroll');

		setTimeout(function() {
			console.log('--- Resetting modal to grid view ---');
			// Reset modal to grid view when closing
			// This ensures modal opens correctly next time
			self.$modal.find('.vns-gallery-single-container').hide();
			// Use .css() to force display: flex instead of .show() which sets display: block
			self.$modal.find('.vns-gallery-grid').css('display', 'flex');
			self.$modal.find('.vns-gallery-close-grid').show();
			self.$modal.find('.vns-gallery-close-single').hide();

			console.log('Modal state AFTER reset:');
			console.log('  Grid display:', $grid.css('display'), 'width:', $grid.css('width'));
			console.log('  Single display:', $single.css('display'), 'width:', $single.css('width'));
			console.log('  Dialog width:', $dialog.css('width'));
			console.log('  Body width:', $body.css('width'));

			self.options.onClosed.call(self);
			self.$element.trigger('closed');
		}, 150);
	},

	close: function() {
		console.log('*** close() called ***');
		this.hideModal();
	},

	next: function() {
		this.options.onNext.call(this, this.currentIndex);
			this.$element.trigger('next', [this.currentIndex]);

			if (this.options.loop) {
				this.currentIndex = (this.currentIndex + 1) % this.images.length;
			} else {
				this.currentIndex = Math.min(this.currentIndex + 1, this.images.length - 1);
			}

			this.options.onChange.call(this, this.currentIndex);
			this.$element.trigger('change', [this.currentIndex]);

			this.showSingleImage();

			this.options.onNextDone.call(this, this.currentIndex);
			this.$element.trigger('nextDone', [this.currentIndex]);
		},

		prev: function() {
			this.options.onPrev.call(this, this.currentIndex);
			this.$element.trigger('prev', [this.currentIndex]);

			if (this.options.loop) {
				this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
			} else {
				this.currentIndex = Math.max(this.currentIndex - 1, 0);
			}

			this.options.onChange.call(this, this.currentIndex);
			this.$element.trigger('change', [this.currentIndex]);

			this.showSingleImage();

		this.options.onPrevDone.call(this, this.currentIndex);
		this.$element.trigger('prevDone', [this.currentIndex]);
	},

	bindDragEvents: function() {
		var self = this;
		var $carousel = this.$element.find('.vns-gallery-thumbnail-carousel-wrapper');

		if (!$carousel.length) return;

		// Prevent default drag behavior on images
		$carousel.find('img').on('dragstart', function(e) {
			e.preventDefault();
		});

		// Mouse events
		$carousel.on('mousedown', function(e) {
			self.dragStart(e);
		});

		$(document).on('mousemove.vnsGalleryDrag-' + self.instanceId, function(e) {
			if (self.dragState.isDragging) {
				self.dragMove(e);
			}
		});

		$(document).on('mouseup.vnsGalleryDrag-' + self.instanceId, function(e) {
			self.dragEnd(e);
		});

		// Touch events
		$carousel.on('touchstart', function(e) {
			self.dragStart(e.originalEvent.touches[0]);
		});

		$carousel.on('touchmove', function(e) {
			if (self.dragState.isDragging) {
				self.dragMove(e.originalEvent.touches[0]);
			}
		});

		$carousel.on('touchend', function(e) {
			self.dragEnd(e);
		});
	},

	dragStart: function(e) {
		// Don't start carousel drag if modal is open
		if (this.$modal && this.$modal.hasClass('vns-gallery-open')) return;

		this.dragState.isDragging = true;
		this.dragState.isModalDrag = false;
		this.dragState.startX = e.pageX || e.clientX;
		this.dragState.startY = e.pageY || e.clientY;
		this.dragState.currentX = this.dragState.startX;

		// Add dragging class for CSS styling
		this.$element.find('.vns-gallery-thumbnail-carousel-wrapper').addClass('vns-gallery-dragging');
	},

	dragMove: function(e) {
		if (!this.dragState.isDragging || this.dragState.isModalDrag) return;

		this.dragState.currentX = e.pageX || e.clientX;

		// Prevent click events when dragging
		e.preventDefault();
	},

	dragEnd: function(e) {
		if (!this.dragState.isDragging || this.dragState.isModalDrag) return;

		this.dragState.isDragging = false;
		this.$element.find('.vns-gallery-thumbnail-carousel-wrapper').removeClass('vns-gallery-dragging');

		var deltaX = this.dragState.currentX - this.dragState.startX;
		var deltaY = Math.abs((e.pageY || e.clientY || this.dragState.startY) - this.dragState.startY);

		// Check if drag distance exceeds threshold and is mostly horizontal
		if (Math.abs(deltaX) > this.options.dragThreshold && Math.abs(deltaX) > deltaY) {
			if (deltaX > 0) {
				// Dragged right - go previous
				this.thumbPrev();
			} else {
				// Dragged left - go next
				this.thumbNext();
			}
		}

		// Reset state
		this.dragState.currentX = 0;
	},

	bindModalDragEvents: function() {
		var self = this;
		var $singleContainer = this.$modal.find('.vns-gallery-single-container');

		if (!$singleContainer.length) return;

		// Prevent default drag behavior on modal images
		$singleContainer.find('img').on('dragstart', function(e) {
			e.preventDefault();
		});

		// Mouse events
		$singleContainer.on('mousedown', '.vns-gallery-single-img', function(e) {
			self.modalDragStart(e);
		});

		$(document).on('mousemove.vnsGalleryModalDrag-' + self.instanceId, function(e) {
			if (self.dragState.isDragging && self.dragState.isModalDrag) {
				self.modalDragMove(e);
			}
		});

		$(document).on('mouseup.vnsGalleryModalDrag-' + self.instanceId, function(e) {
			if (self.dragState.isModalDrag) {
				self.modalDragEnd(e);
			}
		});

		// Touch events
		$singleContainer.on('touchstart', '.vns-gallery-single-img', function(e) {
			self.modalDragStart(e.originalEvent.touches[0]);
		});

		$singleContainer.on('touchmove', function(e) {
			if (self.dragState.isDragging && self.dragState.isModalDrag) {
				self.modalDragMove(e.originalEvent.touches[0]);
			}
		});

		$singleContainer.on('touchend', function(e) {
			if (self.dragState.isModalDrag) {
				self.modalDragEnd(e);
			}
		});
	},

	modalDragStart: function(e) {
		this.dragState.isDragging = true;
		this.dragState.isModalDrag = true;
		this.dragState.startX = e.pageX || e.clientX;
		this.dragState.startY = e.pageY || e.clientY;
		this.dragState.currentX = this.dragState.startX;

		// Add dragging class for CSS styling
		this.$modal.find('.vns-gallery-single-container').addClass('vns-gallery-dragging');
	},

	modalDragMove: function(e) {
		if (!this.dragState.isDragging || !this.dragState.isModalDrag) return;

		this.dragState.currentX = e.pageX || e.clientX;

		// Prevent click events when dragging
		e.preventDefault();
	},

	modalDragEnd: function(e) {
		if (!this.dragState.isDragging || !this.dragState.isModalDrag) return;

		this.dragState.isDragging = false;
		this.dragState.isModalDrag = false;
		this.$modal.find('.vns-gallery-single-container').removeClass('vns-gallery-dragging');

		var deltaX = this.dragState.currentX - this.dragState.startX;
		// For touch events, startY is already stored, so we can calculate deltaY from that
		var endY = (e.pageY || e.clientY) ? (e.pageY || e.clientY) : this.dragState.startY;
		var deltaY = Math.abs(endY - this.dragState.startY);

		// Check if drag distance exceeds threshold and is mostly horizontal
		if (Math.abs(deltaX) > this.options.dragThreshold && Math.abs(deltaX) > deltaY) {
			if (deltaX > 0) {
				// Dragged right - go previous
				this.prev();
			} else {
				// Dragged left - go next
				this.next();
			}
		}

		// Reset state
		this.dragState.currentX = 0;
	},

	loadMoreImages: function() {
		// Remove more indicator
		this.$element.find('.vns-gallery-more-indicator').remove();		var self = this;
		var $grid = this.$element.find('.vns-gallery-static-grid');

		// Add remaining images
		$.each(this.images, function(index, image) {
			if (index >= self.options.maxImages) {
				var itemHTML = '<div class="vns-gallery-static-item">';
				itemHTML += '<img src="' + image.src + '" class="vns-gallery-thumbnail-img" alt="' + image.alt + '" data-index="' + index + '">';
				itemHTML += '</div>';
				$grid.append(itemHTML);
			}
		});

		// Update maxImages to show all
		this.options.maxImages = null;
	},

	destroy: function() {
		// Unbind events
		this.$element.off('.vnsGallery');
		this.$modal.off('.vnsGallery');
		$(window).off('resize.vnsGallery-' + this.modalId);
		$(document).off('keydown.vnsGallery-' + this.modalId);
		$(document).off('mousemove.vnsGalleryDrag-' + this.instanceId);
		$(document).off('mouseup.vnsGalleryDrag-' + this.instanceId);
		$(document).off('mousemove.vnsGalleryModalDrag-' + this.instanceId);
		$(document).off('mouseup.vnsGalleryModalDrag-' + this.instanceId);

		if (this.loopNormalizeTimeout) {
			clearTimeout(this.loopNormalizeTimeout);
			this.loopNormalizeTimeout = null;
		}

		// Remove modal
			this.$modal.remove();

			// Remove plugin data
			this.$element.removeData('vnsGallery');

			this.$element.trigger('destroyed');
		},

		refresh: function() {
			this.destroy();
			this.init();
		},

		generateId: function() {
			return Math.random().toString(36).substr(2, 9);
		}
	};

	// jQuery plugin definition
	$.fn.vnsGallery = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		var instance;

		this.each(function() {
			var $this = $(this);
			var data = $this.data('vnsGallery');

			// Initialize plugin
			if (!data) {
				data = new vnsGallery(this, typeof options === 'object' ? options : {});
				$this.data('vnsGallery', data);
			}

			// Call public method
			if (typeof options === 'string' && typeof data[options] === 'function') {
				data[options].apply(data, args);
			}

			instance = data;
		});

		// Return instance for API calls
		return instance;
	};

	// Expose defaults
	$.fn.vnsGallery.defaults = defaults;

})(jQuery);
