# VNS.Gallery

A flexible jQuery image gallery plugin with thumbnails, lightbox, carousel, and grid view.

Latest release: **1.0.5**

- Seamless infinite thumbnail looping in `loop: true` mode (no visible jump back to first image)

## Features

- 📱 Fully responsive with customizable breakpoints
- 🎨 Carousel or static grid layout
- 🖼️ Modal lightbox with grid and single image views
- ⌨️ Keyboard navigation support
- 🔄 Loop and step navigation options
- 🎯 Thumbnail and fullsize image support for performance
- ⚙️ Highly customizable with extensive options
- 🎪 Interactive demo builder included

## Installation

### Direct Download

Download the files and include them in your HTML:

```html
<link rel="stylesheet" href="dist/vns-gallery.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="dist/vns-gallery.js"></script>
```

## Basic Usage

### HTML Structure

```html
<div class="gallery">
    <img src="img/thumbs/photo-01.jpg" data-fullsize="img/full/photo-01.jpg" alt="Photo 1">
    <img src="img/thumbs/photo-02.jpg" data-fullsize="img/full/photo-02.jpg" alt="Photo 2">
    <img src="img/thumbs/photo-03.jpg" data-fullsize="img/full/photo-03.jpg" alt="Photo 3">
</div>
```

### Initialize Plugin

```javascript
$('.gallery').vnsGallery();
```

### With Options

```javascript
$('.gallery').vnsGallery({
    columns: 4,
    loop: true,
    showAllButton: true,
    modalColumns: 6
});
```

## Options

### Carousel Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useCarousel` | Boolean | `true` | Use carousel navigation (if false, shows static grid) |
| `loop` | Boolean | `false` | Enable looping through images |
| `step` | Number/null | `null` | Number of items to step (null = auto based on visible items) |
| `showAllButton` | Boolean | `true` | Show "See all" button |

### Static Grid Options (when useCarousel is false)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxImages` | Number/null | `null` | Maximum images to show initially (null = show all) |
| `showMoreIndicator` | Boolean | `true` | Show "..." indicator when images are hidden |
| `moreIndicatorAction` | String | `'modal'` | Action on click: 'modal' (open gallery) or 'load' (load more images) |
| `moreIndicatorText` | String | `'...'` | Text for the more indicator |

### Navigation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showNavigation` | Boolean | `true` | Show prev/next arrows in lightbox |
| `showCounter` | Boolean | `true` | Show image counter |
| `showCloseButtonGrid` | Boolean | `true` | Show close (X) button in grid view |
| `showCloseButtonSingle` | Boolean | `true` | Show close (X) button in single view |
| `enableKeyboard` | Boolean | `true` | Enable keyboard navigation |
| `enableDrag` | Boolean | `true` | Enable mouse/touch drag on carousel |
| `dragThreshold` | Number | `50` | Minimum drag distance (in pixels) to trigger navigation |
| `hoverEffect` | Boolean | `false` | Enable hover effect on thumbnails and more indicator |

### Caption Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `captions` | Boolean | `true` | Show captions if available |
| `captionSelector` | String | `'img'` | Element to get caption from: 'img' or 'self' (the container) |
| `captionType` | String | `'attr'` | How to get caption: 'attr', 'data', or 'text' |
| `captionsData` | String | `'alt'` | Attribute name to get caption from (e.g., 'title', 'alt') |
| `captionPosition` | String | `'outside-center'` | Caption position: 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'outside-left', 'outside-center', 'outside-right' |
| `captionDelay` | Number | `0` | Delay before showing caption (in milliseconds) |

### Text Labels

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showAllText` | String | `'Show all'` | Text for "show all" button |
| `prevText` | String | `'◀'` | Text for previous button in modal |
| `nextText` | String | `'▶'` | Text for next button in modal |
| `thumbPrevText` | String | `'‹'` | Text for previous button in thumbnail carousel |
| `thumbNextText` | String | `'›'` | Text for next button in thumbnail carousel |

### Grid Layout Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | Number/null | `null` | Number of columns in front carousel (null = use responsive default: 2/3/4) |
| `modalColumns` | Number | `4` | Number of columns in modal grid view |
| `modalWidth` | String | `'80vw'` | Width of modal in single view (e.g., '80vw', '1200px', '90%') |

### Event Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `onShow` | Function | Called before lightbox opens |
| `onShown` | Function | Called after lightbox opens |
| `onChange` | Function | Called before image changes |
| `onChanged` | Function | Called after image changes |
| `onClose` | Function | Called before lightbox closes |
| `onClosed` | Function | Called after lightbox closes |
| `onNext` | Function | Called before next image |
| `onNextDone` | Function | Called after next image |
| `onPrev` | Function | Called before previous image |
| `onPrevDone` | Function | Called after previous image |
| `onError` | Function | Called on image load error |

### Responsive Option

Define different settings for different screen widths:

```javascript
$('.gallery').vnsGallery({
    responsive: {
        0: { columns: 2 },
        768: { columns: 4 },
        1024: { columns: 6 }
    }
});
```

## Image Attributes

Use `data-fullsize` attribute to specify a larger image for single view:

```html
<img src="thumbnail-small.jpg" data-fullsize="photo-large.jpg" alt="Photo">
```

This improves performance by loading small thumbnails for carousel/grid, then loading full-size only when viewing single image.

## Public Methods

```javascript
var gallery = $('.gallery').vnsGallery();

gallery.open();           // Open gallery (grid view)
gallery.open(2);          // Open specific image (index 2)
gallery.close();          // Close gallery
gallery.next();           // Next image
gallery.prev();           // Previous image
gallery.destroy();        // Destroy instance
gallery.refresh();        // Refresh gallery
```

## Events

```javascript
$('.gallery').on('show', function() {
    console.log('Gallery opening...');
});

$('.gallery').on('changed', function(e, index, image) {
    console.log('Image changed to index:', index);
});
```

Available events: `init`, `show`, `shown`, `close`, `closed`, `change`, `changed`, `next`, `prev`, `nextDone`, `prevDone`

## Demo

Open `demo/index.html` in your browser to see all features and the interactive demo builder.

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers
- Requires jQuery 3.x

## License

[MIT](https://choosealicense.com/licenses/mit/)
