const IMAGE_BASE_URL = 'https://github.com/overview-solutions/RemoteMonitorMap/raw/master/Img/';

function showMapError(message) {
  document.body.innerHTML =
    '<p style="padding:1rem;font:13px/1.5 system-ui,sans-serif;color:#5a5a55">' +
    message +
    ' <a href="https://overview-solutions.github.io/RemoteMonitorMap/" target="_blank" rel="noopener">Open full map</a></p>';
}

if (!window.MAPBOX_TOKEN) {
  showMapError('Map not configured locally — add js/map-config.js (see js/map-config.example.js).');
} else {
  mapboxgl.accessToken = window.MAPBOX_TOKEN;
  // isv.wiki CSP blocks blob: workers. Dedicated CSP worker loads from api.mapbox.com (already allowed).
  mapboxgl.workerUrl = 'https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl-csp-worker.js';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/earthadam/cjxo0sdri31o01clrrw3qesbq',
    projection: 'mercator',
    center: [10, 5],
    zoom: 1
  });

  function addProjectDots() {
    if (map.getSource('projects')) return;
    map.addSource('projects', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/overview-solutions/RemoteMonitorMap/master/projects.geojson'
    });

    map.addLayer({
      id: 'sites',
      type: 'circle',
      source: 'projects',
      paint: {
        'circle-radius': { base: 20, stops: [[12, 5], [22, 180]] },
        'circle-color': [
          'match', ['get', 'Map Color'],
          'G', '#00ff00', 'Y', '#ffff00', 'B', '#39DFff', '#fff'
        ],
        'circle-stroke-color': [
          'match', ['get', 'Map Color'],
          'G', '#004400', 'Y', '#444400', 'B', '#00497A', '#444'
        ],
        'circle-opacity': [
          'match', ['get', 'Map Color'],
          'G', 1, 'Y', 1, 'B', 1, 'D', 0, 1
        ],
        'circle-stroke-opacity': [
          'match', ['get', 'Map Color'],
          'G', 1, 'Y', 1, 'B', 1, 'D', 0, 1
        ],
        'circle-stroke-width': 1
      }
    });

    var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    function handleFeatureEvent(e) {
      map.getCanvas().style.cursor = 'pointer';
      popup.setLngLat(e.features[0].geometry.coordinates)
        .setHTML(createPopupHTML(e.features[0]))
        .addTo(map);
    }

    map.on('mouseover', 'sites', handleFeatureEvent);
    map.on('click', 'sites', handleFeatureEvent);
    map.on('click', function() {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

    map.resize();
  }

  map.on('style.load', addProjectDots);
  map.on('load', addProjectDots);

  map.on('error', function(e) {
    if (e.error && e.error.message) showMapError(e.error.message);
  });
}

function createPopupHTML(feature) {
  const imgTag = `<img src="${IMAGE_BASE_URL}${feature.properties["Country"]}.png" style="width:100px;height:67px;"/>`;
  const linkTag = feature.properties["Link"]
    ? `<h3><a href="${feature.properties["Link"]}">Link to Project</a></h3>`
    : '';
  return `
    ${imgTag}
    <h2>${feature.properties["Organization Contracted"]}</h2>
    ${linkTag}
    ${feature.properties["Project Name"]}<br>
    <b>Country:</b> ${feature.properties["Country"]}<br>
    <b>Years Active:</b> ${feature.properties["Years Active"]}
  `;
}
