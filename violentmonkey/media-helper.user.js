// ==UserScript==
// @name         Media Helper for Instagram
// @namespace    https://github.com/anomalyco/media-helper
// @version      1.28.8-debug
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
  ._aagv: Picture parent
  ._aatn: Video parent
  ._aa64: Stories parent
 */
._aagv,
._ac0b {
  position: relative;
}

._aagv:hover .downloadBtn,
._aatn:hover .downloadBtn,
._ac0b:hover .downloadBtn {
  opacity: 1;
}

._aagv:active .downloadBtn,
._aatn:active .downloadBtn {
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
log('Script loaded on', window.location.pathname);

/*  Home page */
if (window.location.pathname === '/') {
  log('Page type: home');
  var _box_home = document.querySelector('body section > main .xw7yly9');

  if (_box_home) {
    log('Home feed container found immediately');
    findMedia(_box_home);
  } else {
    log('Home feed container not found immediately, retrying in 1s');
  }

  setTimeout(function() {
    _box_home = document.querySelector('body section > main .xw7yly9');

    if (_box_home) {
      log('Home feed container found after delay');
      findMedia(_box_home);
    } else {
      warn('Home feed container not found after delay — selector may be outdated');
    }
  }, 1000);
}

/*  Detail page */
if (window.location.pathname.match('/p/') || window.location.pathname.match('/tv/')) {
  log('Page type: detail');
  var _box_detail = '';

  detailBox();

  if (!_box_detail) {
    log('Detail container not found immediately, retrying in 1s');
    setTimeout(function() {
      detailBox();
    }, 1000);
  }
}

/*  Stories page */
if (window.location.pathname.match('/stories/')) {
  log('Page type: stories');
  setTimeout(function() {
    var _box_story = document.querySelector('section._ac0a > div._ac0b');

    if (_box_story) {
      log('Stories container found');
      findMedia(_box_story, 'stories');
    } else {
      warn('Stories container not found — selector may be outdated');
    }
  }, 50);
}


function detailBox() {
  // Avoid attaching findMedia twice
  if (_box_detail) return;

  /*
    Dialog
  */
  if (document.querySelector('div[role="dialog"]')) {
    if (document.querySelector('div[role="dialog"]').querySelector('article')) {
      log('Detail: dialog with article found immediately');
      _box_detail = document.querySelector('div[role="dialog"]').querySelector('article');
      findMedia(_box_detail);
    } else {
      log('Detail: dialog found but article missing, attaching MutationObserver');
      var _config = { childList: true, subtree: true };
      var _callback = function() {
        _box_detail = document.querySelector('div[role="dialog"]').querySelector('article');
        log('Detail: article appeared in dialog via MutationObserver');
        findMedia(_box_detail);
        _observer.disconnect();
      };
      var _observer = new MutationObserver(_callback);

      _observer.observe(document.querySelector('div[role="dialog"]'), _config);
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

      Match any element inside ._aagv (Instagram may set pointer-events:none on the img itself)
    */
    var _aagvEl = event.target.closest('._aagv') ||
                  (event.target.closest('._aagu') && event.target.closest('._aagu').querySelector('._aagv'));
    if (_aagvEl) {
      var _imgEl = _aagvEl.querySelector('img');
      log('Picture ._aagv matched — img width:', _imgEl ? _imgEl.width : 'no img found');

      // disabled on the thumbnail page
      if (_imgEl && _imgEl.width > 300) {
        _parent = _aagvEl;
        _url = _imgEl.src;
        _username = '';

        var articles = _parent.parents('article').concat(_parent.parents('main'));
        log('Picture ancestors found — article count:', _parent.parents('article').length, '| main count:', _parent.parents('main').length);
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
      Video & IG TV

      video class: _ab1d
      video play cover class: _aakl
    */
    if (event.target.className === '_aakl') {

      _parent = event.target.parentNode;
      _url = _parent.querySelector('._ab1d').src;
      _username = '';

      if (_parent.parents('article').concat(_parent.parents('main'))[0]?.querySelector('a[role="link"].notranslate._a6hd')) {
        _username = _parent.parents('article').concat(_parent.parents('main'))[0].querySelector('a[role="link"].notranslate._a6hd').textContent.trim();
      }

      log('Video detected, user:', _username || '(unknown)', 'url:', _url);
      addBtn(_parent, _url, _username);

    }

    /*
      Stories Picture & Video

      _ac0y parent: cover box (when autoplay videos disable, user click the cover box to play the video)

      Debug: click more button stop auto video
    */
    if (event.target.className === 'x5yr21d x10l6tqk x17qophe x13vifvy xh8yej3' && _way === 'stories') {

      var _parent = document.querySelector('._ac0b');
      _username = _parent.querySelector('header a:not(:has(img))').text;

      // Stories Video: video 'if' in front of the image
      if (_parent.querySelector('video')) {
        _url = _parent.querySelector('video').src;

        log('Stories video detected, user:', _username || '(unknown)', 'url:', _url);
        addBtn(_parent, _url, _username);

        return false;
      }

      // Stories Picture
      if (_parent.querySelector('img')) {

        _url = _parent.querySelector('img').src;

        log('Stories picture detected, user:', _username || '(unknown)', 'url:', _url);
        addBtn(_parent, _url, _username);

        return false;
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

  var _btn = document.createElement('button');
  _btn.type = 'button';
  _btn.className = window.location.pathname.match('/stories/') ? 'downloadBtn inStories' : _btn.className = 'downloadBtn';

  // Video & No Button
  if (_url.indexOf('blob') >= 0 && _flag) {
    warn('Blob video URL detected — cannot download (unsupported):', _url);
    return false;
  }

  // Has Button
  if (!_flag) {
    log('Button already present, reusing existing URL');
    _url = _parent.querySelector('.downloadBtn').getAttribute('data-url');
    _url_param = _url.indexOf('?') >= 0 ? _url.substring(0, _url.indexOf('?')) : _url;
    _filename = username + '_' + _url_param.substring(_url_param.lastIndexOf('/') + 1, _url_param.length);
  } else {
    _btn.setAttribute('data-url', _url);
    log('addBtn: appending button to', _parent.className, 'in 100ms');
    setTimeout(function() {
      log('addBtn: setTimeout fired — appending button now');
      _parent.appendChild(_btn);
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
