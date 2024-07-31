document.addEventListener("DOMContentLoaded", function () {
  const country1 = getQueryVariable("country1");
  const country2 = getQueryVariable("country2");

  if (!country1 || !country2) {
    console.error("Missing country1 or country2 in URL parameters");
    return;
  }

  console.log("Extracted countries from URL:", country1, country2); // Debug log

  fetch("http://localhost:3000/api/config")
    .then((response) => response.json())
    .then((config) => {
      mapboxgl.accessToken = config.mapboxAccessToken;

      const map = new mapboxgl.Map({
        container: "map",
        zoom: 1.5,
        center: [-90, 40],
        style: "mapbox://styles/pjfry/clnger6op083e01qxargvhm65",
        projection: "globe",
      });

      map.on("load", () => {
        map.setFog({});

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

        console.log("Map and layers are loaded");

        if (selectedCountries.length > 0) {
          console.log("Calling updateHighlightFilter");
          updateHighlightFilter(map);
        }
      });

      document.getElementById("country1-info").textContent = country1;
      document.getElementById("country2-info").textContent = country2;

      selectedCountries.push(country1, country2);

      fetchRelationshipSummary(country1, country2)
        .then((summary) => {
          if (summary) {
            document.getElementById("relationship-summary").innerHTML = summary;
          } else {
            console.error("No relationship summary found.");
            document.getElementById("relationship-summary").innerHTML =
              "No relationship summary found.";
          }
        })
        .catch((error) => {
          console.error("Error fetching relationship summary:", error);
          document.getElementById("relationship-summary").innerHTML =
            "An error occurred while fetching the relationship summary.";
        });

      fetchTimeline(country1, country2)
        .then((data) => {
          if (data && data.length > 0) {
            const eventIDs = data.map((entry) => entry._id);
            localStorage.setItem("eventIDs", JSON.stringify(eventIDs));

            data.forEach((entry) => {
              localStorage.setItem(entry._id, entry.year); // Store year with ID
            });

            generateTimelineEntries(data);
          } else {
            console.error("No timeline data found.");
          }
        })
        .catch((error) => console.error("Error fetching timeline:", error));
    })
    .catch((error) => console.error("Error fetching Mapbox API Key:", error));
});

let selectedCountries = [];

function fetchRelationshipSummary(country1, country2) {
  return fetch(
    `http://localhost:3000/api/relationship-summary?country1=${encodeURIComponent(
      country1
    )}&country2=${encodeURIComponent(country2)}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.relationshipSummary) {
        return data.relationshipSummary;
      } else {
        // Try again with countries swapped
        return fetch(
          `http://localhost:3000/api/relationship-summary?country1=${encodeURIComponent(
            country2
          )}&country2=${encodeURIComponent(country1)}`
        )
          .then((response) => response.json())
          .then((data) => data.relationshipSummary || null);
      }
    });
}

function fetchTimeline(country1, country2) {
  return fetch(
    `http://localhost:3000/api/timeline?country1=${encodeURIComponent(
      country1
    )}&country2=${encodeURIComponent(country2)}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        return data;
      } else {
        // Try again with countries swapped
        return fetch(
          `http://localhost:3000/api/timeline?country1=${encodeURIComponent(
            country2
          )}&country2=${encodeURIComponent(country1)}`
        )
          .then((response) => response.json())
          .then((data) => (data.length > 0 ? data : null));
      }
    });
}

function updateHighlightFilter(map) {
  console.log("updateHighlightFilter called");
  console.log("Map instance: ", map);

  if (!map) {
    console.error("Map instance is not available");
    return;
  }

  // Check if the map instance has the getLayer method
  if (typeof map.getLayer !== "function") {
    console.error(
      "map.getLayer is not a function. Ensure Mapbox GL JS is properly integrated."
    );
    return;
  }

  // Check if the highlight-layer exists using getLayer
  if (map.getLayer("highlight-layer")) {
    console.log("highlight-layer exists");
    map.setFilter("highlight-layer", [
      "in",
      ["get", "COUNTRY_NAME"],
      ["literal", selectedCountries],
    ]);
  } else {
    console.error("highlight-layer does not exist");
    // Try to re-add the highlight-layer
    map.addLayer({
      id: "highlight-layer",
      type: "fill",
      source: "countries",
      layout: {},
      paint: {
        "fill-color": "#f08",
        "fill-opacity": 0.75,
      },
      filter: ["in", ["get", "COUNTRY_NAME"], ["literal", selectedCountries]],
    });
  }
}

function generateTimelineEntries(timelineData) {
  const container = document.getElementById("timeline-container");
  container.innerHTML = ""; // Clear existing entries

  timelineData.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "timeline-entry";
    div.onclick = () => goToTimelineEvent(entry._id, entry.year); // Pass _id and year when entry is clicked
    div.innerHTML = `
      <div class="timeline-year">${entry.year}</div>
      <div class="timeline-text">${entry.text}</div>
    `;
    container.appendChild(div);
  });
}

function goToTimelineEvent(_id, year) {
  window.location.href = `event.html?_id=${encodeURIComponent(
    _id
  )}&year=${encodeURIComponent(year)}`;
}

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

console.log(mapboxgl);
