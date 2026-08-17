/**
 * Village Metering standalone pages — embed mode (?embed=1)
 * Keeps in-iframe navigation on meter-*.html and delegates wiki hash links to parent.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  if (params.get('embed') !== '1') return;

  document.documentElement.classList.add('embed');
  if (params.get('panel') === '1') document.documentElement.classList.add('panel');

  var PAGE_ALIASES = {
    'problems-today': 'overview',
    problems: 'overview',
    'solutions-map': 'overview',
    'tc20-stack': 'tc20-review',
    'village-topology': 'tc20-review',
    scope: 'village-scope',
    'worldline-day': 'village-simulator',
    'worldline-day-100': 'village-simulator'
  };

  var PAGE_BY_ID = {
    overview: 'meter-overview.html',
    roadmap: 'meter-roadmap.html',
    'tc20-review': 'meter-tc20-review.html',
    'village-scope': 'meter-village-scope.html',
    vmrs: 'meter-vmrs.html',
    'vendor-study': 'meter-vendor-study.html',
    openami: 'openami.html',
    meshems: 'meshems.html',
    'village-simulator': 'village-simulator/index.html'
  };

  var ID_BY_FILE = Object.keys(PAGE_BY_ID).reduce(function (acc, id) {
    acc[PAGE_BY_ID[id]] = id;
    return acc;
  }, {
    'meter-problems-today.html': 'overview',
    'meter-solutions-map.html': 'overview',
    'meter-tc20-stack.html': 'tc20-review',
    'meter-village-topology.html': 'tc20-review'
  });

  function resolvePageId(id) {
    if (!id) return 'overview';
    return PAGE_ALIASES[id] || id;
  }

  function findWikiParent() {
    var w = window;
    while (w.parent && w.parent !== w) {
      try {
        if (typeof w.parent.showMeterPage === 'function') return w.parent;
      } catch (e) {
        break;
      }
      w = w.parent;
    }
    return null;
  }

  function parentMeterNav(pageId) {
    var wiki = findWikiParent();
    if (!wiki) return false;
    wiki.showMeterPage(resolvePageId(pageId));
    return true;
  }

  function meterSrc(pageId) {
    return (PAGE_BY_ID[resolvePageId(pageId)] || PAGE_BY_ID.overview) + '?embed=1';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.target === '_top') return;

    var hashMatch = href.match(/index\.html#(?:village-metering|meter-study)(?:\/([\w-]+))?\/?$/);
    if (hashMatch) {
      e.preventDefault();
      var pageId = resolvePageId(hashMatch[1]);
      if (!parentMeterNav(pageId)) location.href = meterSrc(pageId);
      return;
    }

    if (href === 'index.html' || href === './index.html' || href === '../index.html') {
      e.preventDefault();
      var wiki = findWikiParent();
      if (wiki && typeof wiki.showSection === 'function') {
        wiki.showSection('home');
      } else {
        a.target = '_top';
        location.href = href;
      }
      return;
    }

    var fileMatch = href.match(/^([^?#]*(?:meter-[\w-]+|openami|meshems)\.html)(?:[?#].*)?$/);
    if (fileMatch) {
      var file = fileMatch[1].replace(/^\.\//, '');
      var base = file.split('/').pop();
      var pageId = ID_BY_FILE[base];
      if (pageId && findWikiParent()) {
        e.preventDefault();
        if (!parentMeterNav(pageId)) location.href = meterSrc(pageId);
      }
    }
  }, true);
})();
