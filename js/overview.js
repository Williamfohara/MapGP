let map; // Declare map globally

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  return false;
}

document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/api/config")
    .then((response) => response.json())
    .then((config) => {
      // Use the fetched Mapbox access token
      mapboxgl.accessToken = config.mapboxAccessToken;

      // Initialize the map
      map = new mapboxgl.Map({
        container: "map",
        zoom: 1.5,
        center: [-90, 40],
        style: "mapbox://styles/pjfry/clnger6op083e01qxargvhm65",
        projection: "globe",
      });

      map.on("load", () => {
        map.setFog({}); // Set the default atmosphere style

        // Add sources and layers once the map has loaded
        map.addSource("countries", {
          type: "geojson",
          data: "../data/countries.geojson",
        });

        map.addLayer({
          id: "countries-layer",
          type: "fill",
          source: "countries",
          layout: {},
          paint: {
            "fill-color": "#627BC1",
            "fill-opacity": 0.5,
          },
        });

        map.addLayer({
          id: "highlight-layer",
          type: "fill",
          source: "countries",
          layout: {},
          paint: {
            "fill-color": "#f08",
            "fill-opacity": 0.75,
          },
          filter: ["in", ["get", "COUNTRY_NAME"], ["literal", []]],
        });
      });

      var country1 = getQueryVariable("country1");
      var country2 = getQueryVariable("country2");

      if (country1 && country2) {
        document.getElementById("country1-info").textContent = country1;
        document.getElementById("country2-info").textContent = country2;

        selectedCountries.push(country1, country2);
        updateHighlightFilter();
      }

      fetch("../data/MEXUSTimelineData.json")
        .then((response) => response.json())
        .then((data) => {
          generateTimelineEntries(data);
        });
    })
    .catch((error) => console.error("Error fetching Mapbox API Key:", error));
});

let selectedCountries = [];

function updateHighlightFilter() {
  if (map.isStyleLoaded()) {
    map.setFilter("highlight-layer", [
      "in",
      ["get", "COUNTRY_NAME"],
      ["literal", selectedCountries],
    ]);
  } else {
    setTimeout(updateHighlightFilter, 100);
  }
}

function generateTimelineEntries(timelineData) {
  const container = document.getElementById("timeline-container");
  timelineData.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "timeline-entry";
    div.onclick = () => goToTimelineEvent(entry._id); // Pass _id when entry is clicked
    div.innerHTML = `
      <div class="timeline-year">${entry.year}</div>
      <div class="timeline-text">${entry.text}</div>
    `;
    container.appendChild(div);
  });
}

function goToTimelineEvent(_id) {
  window.location.href = `event.html?_id=${encodeURIComponent(_id)}`;
}
