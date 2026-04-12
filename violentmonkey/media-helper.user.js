// ==UserScript==
// @name         Media Helper for Instagram
// @namespace    https://github.com/anomalyco/media-helper
// @version      1.28.9
// @description  Easily download Instagram pictures and videos.
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
  Common function
*/
Element.prototype.parents = function(selector) {
  // Vanilla JS jQuery.parents() realisation
  // https://gist.github.com/ziggi/2f15832b57398649ee9b

  var elements = [];
  var elem = this;
  var ishaveselector = selector !== undefined;

  while ((elem = elem.parentElement) !== null) {
    if (elem.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    if (!ishaveselector || elem.matches(selector)) {
      elements.push(elem);
    }
  }

  return elements;
};


/*
  Main
*/

// Patch history API to fire a custom event on pushState/replaceState,
// since popstate alone does not fire on programmatic navigation.
(function() {
  function patchHistory(method) {
    var original = history[method];
    history[method] = function() {
      var result = original.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  }
  patchHistory('pushState');
  patchHistory('replaceState');
  window.addEventListener('popstate', function() {
    window.dispatchEvent(new Event('locationchange'));
  });
})();

var _box_detail = '';
var _storiesInitialized = false;

function initPage() {
  var path = window.location.pathname;
  log('initPage:', path);

  /*  Home page */
  if (path === '/') {
    log('Page type: home');
    var _box_home = document.querySelector('body section > main .xw7yly9') ||
                    document.querySelector('main[role="main"]');

    if (_box_home) {
      log('Home feed container found immediately');
      findMedia(_box_home);
    } else {
      log('Home feed container not found immediately, setting up MutationObserver');
      var _homeObserver = new MutationObserver(function(mutations, obs) {
        var _container = document.querySelector('body section > main .xw7yly9') ||
                         document.querySelector('main[role="main"]');
        if (_container) {
          log('Home feed container found via MutationObserver');
          obs.disconnect();
          findMedia(_container);
        }
      });
      _homeObserver.observe(document.body, { childList: true, subtree: true });
      // Disconnect after 30s to avoid memory leaks if page never loads feed
      setTimeout(function() {
        _homeObserver.disconnect();
        warn('Home feed container not found after 30s — selector may be outdated');
      }, 30000);
    }
  }

  /*  Detail page */
  if (path.match('/p/')) {
    log('Page type: detail');
    _box_detail = '';
    detailBox();

    if (!_box_detail) {
      log('Detail container not found immediately, retrying in 1s');
      setTimeout(detailBox, 1000);
    }
  }

  /*  Stories page */
  if (path.match('/stories/')) {
    if (_storiesInitialized) {
      log('Page type: stories — already initialized, skipping');
      return;
    }
    log('Page type: stories');
    setTimeout(function() {
      // The stories viewer is a <section> inside the main flex container
      var _box_story = document.querySelector('section.x5yr21d.x78zum5') ||
                       document.querySelector('section[class*="x5yr21d"]');

      if (_box_story) {
        log('Stories container found');
        _storiesInitialized = true;
        findMedia(_box_story, 'stories');
      } else {
        warn('Stories container not found — selector may be outdated');
      }
    }, 50);
  } else {
    // Reset when leaving stories so re-entry re-attaches
    _storiesInitialized = false;
  }
}

log('Script loaded on', window.location.pathname);
initPage();
window.addEventListener('locationchange', initPage);


function detailBox() {
  // Avoid attaching findMedia twice
  if (_box_detail) return;

  /*
    Dialog
  */
  var _dialog = document.querySelector('div[role="dialog"]');
  if (_dialog) {
    if (_dialog.querySelector('article')) {
      log('Detail: dialog with article found immediately');
      _box_detail = _dialog.querySelector('article');
      findMedia(_box_detail);
    } else {
      log('Detail: dialog found but article missing, attaching MutationObserver');
      var _config = { childList: true, subtree: true };
      var _callback = function() {
        _box_detail = _dialog.querySelector('article');
        log('Detail: article appeared in dialog via MutationObserver');
        findMedia(_box_detail);
        _observer.disconnect();
      };
      var _observer = new MutationObserver(_callback);

      _observer.observe(_dialog, _config);
    }
  }

  /*
    Absolute
  */
  else {
    _box_detail = document.querySelector('div[role="presentation"]') ||
                  document.querySelector('main[role="main"]');
    if (!_box_detail) {
      warn('Detail: neither div[role="presentation"] nor main[role="main"] found — selector may be outdated');
      return;
    }
    log('Detail: no dialog, using', _box_detail.tagName, 'role=' + _box_detail.getAttribute('role'));
    findMedia(_box_detail);
  }
}

function findMedia(box, way) {
  var _box = box, _way = way;
  var _parent, _url, _username;

  log('findMedia: attaching mouseover to', _box.tagName, _box.className || _box.id || '(no class/id)', 'way:', _way || 'detail/home');

  _box.addEventListener('mouseover', function(event) {

    if (event.target.tagName === 'IMG') {
      log('mouseover IMG — className:', JSON.stringify(event.target.className), '| width:', event.target.width);
    } else {
      var _aagvCheck = event.target.closest('._aagv');
      if (_aagvCheck) log('mouseover non-IMG inside ._aagv — target tag:', event.target.tagName, '| className:', JSON.stringify(event.target.className));
    }

    /*
      Picture

      Match any element inside ._aagv (Instagram may set pointer-events:none on the img itself).
      Button is injected into ._aagu (parent of ._aagv) to avoid overflow:hidden on ._aagv
      clipping the absolutely-positioned button.
    */
    var _aagvEl = event.target.closest('._aagv') ||
                  (event.target.closest('._aagu') && event.target.closest('._aagu').querySelector('._aagv'));
    if (_aagvEl) {
      var _imgEl = _aagvEl.querySelector('img');
      // Inject into _aagu (parent) so overflow:hidden on _aagv doesn't clip the button
      var _aaguEl = _aagvEl.closest('._aagu') || _aagvEl.parentElement;
      log('Picture ._aagv matched — img width:', _imgEl ? _imgEl.width : 'no img found');

      // disabled on the thumbnail page
      if (_imgEl && _imgEl.width > 300) {
        _parent = _aaguEl;
        _url = _imgEl.src;
        _username = '';

        var articles = _aagvEl.parents('article').concat(_aagvEl.parents('main'));
        log('Picture ancestors found — article count:', _aagvEl.parents('article').length, '| main count:', _aagvEl.parents('main').length);
        if (articles[0] && articles[0].querySelector('a[role="link"].notranslate._a6hd')) {
          _username = articles[0].querySelector('a[role="link"].notranslate._a6hd').textContent.trim();
        }

        log('Picture detected, user:', _username || '(unknown)', 'url:', _url);
        addBtn(_parent, _url, _username);
      } else if (_imgEl) {
        log('Picture ._aagv matched but width too small (thumbnail), skipping — width:', _imgEl.width);
      }

    }

    /*
      Stories Picture

      Detect mouseover on the story image or its container.
      The story card root is div.xyzq4qe.x87ps6o which wraps
      both the header and the image content.
    */
    if (_way === 'stories') {
      var _storyCard = event.target.closest('div.xyzq4qe.x87ps6o');
      if (_storyCard) {
        var _storyImg = _storyCard.querySelector('img[referrerpolicy="origin-when-cross-origin"]') ||
                        _storyCard.querySelector('img[draggable="false"]:not([alt=""])');

        if (_storyImg && _storyImg.src) {
          _parent = _storyCard;
          _url = _storyImg.src;

          var _usernameEl = _storyCard.querySelector('header a:not(:has(img))') ||
                            _storyCard.querySelector('a._a6hd:not(:has(img))');
          _username = _usernameEl ? (_usernameEl.textContent || _usernameEl.text || '').trim() : '';

          log('Stories picture detected, user:', _username || '(unknown)', 'url:', _url);
          addBtn(_parent, _url, _username);
        }
      }
    }

  });
}

function addBtn(parent, url, username) {
  var _parent = parent;
  var _url = url;
  var _url_param = url.indexOf('?') >= 0 ? url.substring(0, url.indexOf('?')) : url;
  var _filename = username + '_' + _url_param.substring(_url_param.lastIndexOf('/') + 1, _url_param.length);
  var _flag = true;

  log('addBtn called — parent:', _parent.className, '| url:', _url.substring(0, 80));

  if (_parent.querySelector('.downloadBtn')) {
    if (_parent.querySelector('.downloadBtn').getAttribute('data-url')) {
      log('addBtn: button already present with data-url, reusing');
      _flag = false;
    } else {
      log('addBtn: stale button found (no data-url), removing');
      _parent.removeChild(_parent.querySelector('.downloadBtn'));
    }
  }

  // Guard against multiple rapid mouseover calls scheduling duplicate appends
  // before the first setTimeout fires (race condition).
  if (_flag && _parent.getAttribute('data-mh-pending')) {
    log('addBtn: append already pending, skipping duplicate');
    return;
  }

  var _btn = document.createElement('button');
  _btn.type = 'button';
  _btn.className = window.location.pathname.match('/stories/') ? 'downloadBtn inStories' : _btn.className = 'downloadBtn';

  // Has Button
  if (!_flag) {
    log('Button already present, reusing existing URL');
    _url = _parent.querySelector('.downloadBtn').getAttribute('data-url');
    _url_param = _url.indexOf('?') >= 0 ? _url.substring(0, _url.indexOf('?')) : _url;
    _filename = username + '_' + _url_param.substring(_url_param.lastIndexOf('/') + 1, _url_param.length);
  } else {
    _btn.setAttribute('data-url', _url);
    _parent.setAttribute('data-mh-pending', '1');
    log('addBtn: appending button to', _parent.className, 'in 100ms');
    setTimeout(function() {
      _parent.removeAttribute('data-mh-pending');
      // Re-check: another button may have been appended while we waited
      if (!_parent.querySelector('.downloadBtn')) {
        log('addBtn: setTimeout fired — appending button now');
        _parent.appendChild(_btn);
      } else {
        log('addBtn: setTimeout fired — button already present, skipping append');
      }
    }, 100);
  }

  _btn.addEventListener('click', function(event) {
    event.stopPropagation();

    log('Download triggered — file:', _filename, 'url:', _url);
    GM_download({
      url: _url,
      name: _filename,
      headers: {
        'Referer': 'https://www.instagram.com/'
      },
      onload: function() {
        log('Download complete:', _filename);
      },
      onError: function(err) {
        warn('Download failed:', _filename, err);
      }
    });
  }, false);
}
