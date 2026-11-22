// ==UserScript==
// @name         Media Helper for Instagram
// @namespace    https://github.com/anomalyco/media-helper
// @version      1.33.0
// @description  Easily download Instagram pictures and skip video stories.
// @match        *://*.instagram.com/*
// @grant        GM_download
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-idle
// ==/UserScript==

'use strict';

const LOG_PREFIX = '[Media Helper]';
function log(...args)  { console.log(LOG_PREFIX, ...args); }
function warn(...args) { console.warn(LOG_PREFIX, ...args); }

GM_addStyle(`
.downloadBtn {
  position: absolute;
  right: 25px;
  top: 25px;
  z-index: 2;
  opacity: 0;
  width: 46px;
  height: 28px;
  padding: 0 8px;
  line-height: 26px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: opacity .1s ease-out;
  transition-delay: .1s;
  border-radius: 3px;
  border: 1px solid #db2d74;
  background-color: #db2d74;
}

.downloadBtn.inStories {
  width: 28px;
  top: 74px;
  right: 22px;
  border-radius: 50%;
  font-size: 12px;
}

/*
  ._aagu: Picture outer wrapper; the button lives here because its child ._aagv has overflow:hidden
  div.xyzq4qe.x87ps6o: Stories card root
 */
._aagu,
div.xyzq4qe.x87ps6o {
  position: relative;
}

._aagu:hover .downloadBtn,
div.xyzq4qe.x87ps6o:hover .downloadBtn {
  opacity: 1;
}

._aagu:active .downloadBtn {
  opacity: .9;
}

/* pic cover */
._aagw {
  display: none !important;
}
`);

/**
 * Extract the post author username from a container element.
 * Looks inside a header element first to avoid matching "Liked by" links,
 * and excludes anchor tags that wrap images (avatar links).
 */
function extractUsername(container) {
  var header = container.querySelector('header._aaqw') ||
               container.querySelector('header');
  var anchor = (header || container).querySelector('a[role="link"]._a6hd:not(:has(img))') ||
               (header || container).querySelector('a._a6hd:not(:has(img))');
  return anchor ? anchor.textContent.trim() : '';
}

function findImg(parent, inStories) {
  return inStories
    ? parent.querySelector('img[referrerpolicy="origin-when-cross-origin"]') ||
      parent.querySelector('img[draggable="false"]:not([alt=""])')
    : parent.querySelector('._aagv img');
}

function largestUrl(candidates) {
  return candidates.reduce(function(a, b) { return b.width * b.height > a.width * a.height ? b : a; }).url;
}

// The story <img> is sized to the window. React props hold the full-size original for the
// reel the page was opened on; other reels only hold Relay references, so fall back to the media info API.
async function fullSizeStoryUrl(img) {
  var parts = window.location.pathname.split('/').filter(Boolean);
  // Highlight URLs hold the highlight ID, not the media ID.
  var id = parts[1] !== 'highlights' && parts[2];
  if (!id) return null;

  var key = Object.keys(img).find(function(k) { return k.startsWith('__reactFiber$'); });
  for (var fiber = key && img[key]; fiber; fiber = fiber.return) {
    var reel = fiber.memoizedProps && fiber.memoizedProps.reel;
    var item = reel && reel.items && reel.items.find(function(i) {
      return String(i.pk) === id && i.image_versions2;
    });
    if (item) return largestUrl(item.image_versions2.candidates);
  }

  try {
    var res = await fetch(window.location.origin + '/api/v1/media/' + id + '/info/', {
      credentials: 'include',
      headers: { 'X-IG-App-ID': '936619743392459' }
    });
    return largestUrl((await res.json()).items[0].image_versions2.candidates);
  } catch (err) {
    warn('Full-size lookup failed, using on-screen image', err);
    return null;
  }
}

// One delegated listener on document covers home, post, dialog and stories, and survives SPA navigation.
document.addEventListener('mouseover', function(event) {
  var inStories = window.location.pathname.startsWith('/stories/');
  // Button goes in ._aagu, not ._aagv, whose overflow:hidden would clip it.
  var parent = event.target.closest('._aagu') ||
               (inStories && event.target.closest('div.xyzq4qe.x87ps6o'));
  if (!parent || parent.querySelector('.downloadBtn')) return;

  var img = findImg(parent, inStories);
  // width <= 300: grid thumbnail
  if (!img || !img.src || (!inStories && img.width <= 300)) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = inStories ? 'downloadBtn inStories' : 'downloadBtn';
  // U+FE0E keeps the arrow as text instead of an emoji.
  btn.textContent = '\u2B07\uFE0E';
  btn.setAttribute('aria-label', 'Download');
  btn.title = inStories || onPhotoPage() ? 'Download (D)' : 'Download';

  btn.addEventListener('click', function(clickEvent) {
    clickEvent.stopPropagation();
    downloadFrom(parent, inStories);
  });

  parent.appendChild(btn);
});

async function downloadFrom(parent, inStories) {
  // Read at download time: the story card is reused across stories.
  var img = findImg(parent, inStories);
  if (!img || !img.src) return warn('No image found to download');
  var url = (inStories && await fullSizeStoryUrl(img)) || img.src;
  var box = inStories ? parent : parent.closest('article') || parent.closest('main');
  var filename = (box ? extractUsername(box) : '') + '_' + new URL(url).pathname.split('/').pop();

  GM_download({
    url: url,
    name: filename,
    headers: {
      'Referer': 'https://www.instagram.com/'
    },
    onload: function() {
      log('Download complete:', filename);
    },
    onerror: function(err) {
      warn('Download failed:', filename, err);
    }
  });
}

function onPhotoPage() {
  return /\/p\/[^/]+/.test(window.location.pathname);
}

function visibleArea(el, frame) {
  var r = el.getBoundingClientRect();
  return Math.max(0, Math.min(r.right, frame.right) - Math.max(r.left, frame.left)) *
         Math.max(0, Math.min(r.bottom, frame.bottom) - Math.max(r.top, frame.top));
}

// The post comes before the "More posts" grid, so its photo is the first ._aagu.
// Carousels keep the previous, current and next slides in the DOM; the current one fills the clipping frame.
function focusedPhoto() {
  var root = document.querySelector('div[role="dialog"]') || document.querySelector('main');
  var first = root && root.querySelector('._aagu');
  var slide = first && first.closest('li');
  if (!slide) return first;

  var clip = slide.parentElement;
  while (clip && getComputedStyle(clip).overflowX !== 'hidden') clip = clip.parentElement;
  if (!clip) return first;

  var frame = clip.getBoundingClientRect();
  return Array.from(slide.parentElement.querySelectorAll('._aagu')).reduce(function(a, b) {
    return visibleArea(b, frame) > visibleArea(a, frame) ? b : a;
  });
}

// The previous and next stories show as smaller cards beside the current one.
function focusedStoryCard() {
  var frame = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  var cards = Array.from(document.querySelectorAll('div.xyzq4qe.x87ps6o'));
  return cards.length ? cards.reduce(function(a, b) {
    return visibleArea(b, frame) > visibleArea(a, frame) ? b : a;
  }) : null;
}

// D downloads the focused photo on photo pages and stories. Capture phase so Instagram doesn't also handle it.
document.addEventListener('keydown', function(event) {
  if (event.code !== 'KeyD' || event.repeat ||
      event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
  var target = event.target;
  if (target.isContentEditable || (target.closest && target.closest('input, textarea, select'))) return;

  var inStories = window.location.pathname.startsWith('/stories/');
  if (!inStories && !onPhotoPage()) return;
  var parent = inStories ? focusedStoryCard() : focusedPhoto();
  if (!parent) return warn('No photo found to download');

  event.preventDefault();
  event.stopPropagation();
  downloadFrom(parent, inStories);
}, true);

// Skip video stories. 'play' doesn't bubble, so listen in the capture phase.
// Each video is skipped once, so going back to it lets it play. Keyed by src: highlight URLs don't change per item.
var skipVideos = GM_getValue('skipVideos', true);
var skipMenuId;
function updateSkipMenu() {
  if (skipMenuId) GM_unregisterMenuCommand(skipMenuId);
  skipMenuId = GM_registerMenuCommand((skipVideos ? 'Stop' : 'Start') + ' skipping video stories', function() {
    skipVideos = !skipVideos;
    GM_setValue('skipVideos', skipVideos);
    updateSkipMenu();
  });
}
updateSkipMenu();

var skippedVideo;
document.addEventListener('play', function(event) {
  var video = event.target;
  if (!skipVideos || video.tagName !== 'VIDEO' || !window.location.pathname.startsWith('/stories/')) return;
  if (video.currentSrc === skippedVideo) return;
  skippedVideo = video.currentSrc;
  video.pause();
  // The page has two Next buttons; only the one nearest the video advances this story.
  for (var el = video.parentElement; el; el = el.parentElement) {
    var next = el.querySelector('[aria-label="Next"]');
    if (next) return (next.closest('button, [role="button"]') || next).click();
  }
}, true);
