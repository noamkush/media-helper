// ==UserScript==
// @name         Media Helper for Instagram
// @namespace    https://github.com/anomalyco/media-helper
// @version      1.29.0
// @description  Easily download Instagram pictures.
// @match        *://*.instagram.com/*
// @grant        GM_download
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

'use strict';

const LOG_PREFIX = '[Media Helper]';
function log(...args)  { console.log(LOG_PREFIX, ...args); }
function warn(...args) { console.warn(LOG_PREFIX, ...args); }

/*
  Styles (inlined from style.css)
*/
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
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  transition: opacity .1s ease-out;
  transition-delay: .1s;
  border-radius: 3px;
  border: 1px solid #db2d74;
  background-color: #db2d74;
  background-size: 22px;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjEuNDE0MjE7Ij48dXNlIGlkPSJpY29uIC8gZG93bmxvYWQiIHhsaW5rOmhyZWY9IiNfSW1hZ2UxIiB4PSIxNC4wMDkiIHk9IjMzIiB3aWR0aD0iMjI3LjQ5MXB4IiBoZWlnaHQ9IjE5MC40OTdweCIvPjxkZWZzPjxpbWFnZSBpZD0iX0ltYWdlMSIgd2lkdGg9IjIyOHB4IiBoZWlnaHQ9IjE5MXB4IiB4bGluazpocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQU9RQUFBQy9DQVlBQUFEdUhuQzVBQUFBQ1hCSVdYTUFBQTdFQUFBT3hBR1ZLdzRiQUFBSm8wbEVRVlI0bk8yZDJhN2pLaEFBbStqKy95LzdQaVRPT0Q3ZXNPa05xcVNSUnJPY3hOQkZOeGpqTWsyVFFEZzJPK1ZPWDVWU2R2K3Erb2VCT2dVaDNmbDJnRWRmTElSRjBBQWdwRDJ1QXA2eHlxaElhZ3hDMmpDSnhCVHdEREtvTFFpcFIxb0o5MEJPZlJDeVBWUHZiWXFZZWlCa0c3ckxobGRCenJZZzVETzZ6NFpYUWN3MklPUTloczJJWjN6RVJNcWJJR1E5Wk1VTElPWTlFUEk2aUhnRHhLd0RJYzlCeEljd3Y3d09RdTdEUExFeFpNdHpFSElic3FJaWlMblB5L3NMQkFRWmxmbTBMNDI4QVVMK1l4SmtOQU1wdDZGa2ZZT0lUckRnOHd0Q0ltTUltRmUrR2Ixa1JjWWdVTUsrR1ZsSVpBd0dVbzVic3FhUmNlTk1uSnF5THZUcEJIdU1YTDZPS0dSWUdZMk96MGdoNmFoU2ppWmtPQm1EckRLRzNKVTBvcFFqQ1JsR3hpQVM3aEZLenRHa0hFVklkeG1EUzdoRkdERkhrbklFSVYxbFRDamlGbEVHdE14dGVJbmVoWXdnWTA5QlJIc3EwN09RYnNFelFPRFF0a3IwS3FSTHdQUWVMQnZRem8zcGNhZU9lWkNVVXJvT2tnUEt3Y3Q4NEFZOUNtbktRc1JSSTdOOE1QdkFucmZZOVNha2FYWWNOQ3Z1Z1pRTjZHa09hU1lqSXA1aTJSZGQ5VU0zR1JJWlEySHBTVGNaUmFRZklVMDZCUm1yTUpHeXQ5SzFCeUZOeWlOa3ZBVlNWcEplU0dRTVQyL1RQRld5QzZsdUl6STJRVjNLWHJKa2FpRzFzeU15Tm9WTWVZSE1RcXJhaUl3cXFFclpRNWJNS3FUcVFnNHlxbUloWlZxeUNxa0dNcHFnWGI2bXRUS2prR3JaRVJuN0lIT1d6Q2lrSnNob0IxbHlnMnhDYW1kSHNFVk55cXhaTXBPUWxLcDlvdGJ1bjRDWmY2VWcrdE1lSmllZmNZUE1IY3Z0anlLQkI5OW9Rc");
}

.downloadBtn.inStories {
  width: 28px;
  top: 74px;
  right: 22px;
  border-radius: 50%;
  font-size: 12px;
  background-size: 18px;
}

/*
  ._aagu: Picture outer wrapper (parent of ._aagv)
  ._aagv: Picture aspect-ratio box — has overflow:hidden so button must live in ._aagu
  .xyzq4qe.x5yr21d.x87ps6o: Stories card root (current)
 */
._aagu,
._aagv,
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

/* Top Bar ._lz6s zIndex > .downloadBtn zIndex */
._lz6s {
  z-index: 3 !important;
}
`);


/*
  Main
*/

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
  return anchor ? (anchor.textContent || anchor.text || '').trim() : '';
}

function findImg(parent, inStories) {
  return inStories
    ? parent.querySelector('img[referrerpolicy="origin-when-cross-origin"]') ||
      parent.querySelector('img[draggable="false"]:not([alt=""])')
    : parent.querySelector('._aagv img');
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
  btn.setAttribute('aria-label', 'Download');
  btn.title = 'Download';

  btn.addEventListener('click', function(clickEvent) {
    clickEvent.stopPropagation();

    // Read at click time: the story card is reused across stories.
    var img = findImg(parent, inStories);
    if (!img || !img.src) return warn('No image found to download');
    var box = inStories ? parent : parent.closest('article') || parent.closest('main');
    var filename = (box ? extractUsername(box) : '') + '_' + new URL(img.src).pathname.split('/').pop();

    GM_download({
      url: img.src,
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
  });

  parent.appendChild(btn);
});
