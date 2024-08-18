document.addEventListener("DOMContentLoaded", function () {
  let country1 = getQueryVariable("country1");
  let country2 = getQueryVariable("country2");

  if (!country1 || !country2) {
    console.error("Missing country1 or country2 in URL parameters");
    return;
  }

  // Display country1 and country2 in the info panel header
  document.getElementById("country1-info").textContent = country1;
  document.getElementById("country2-info").textContent = country2;

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

        fetch("/data/countryCoordinates/allCountryCoordinates.geojson")
          .then((response) => response.json())
          .then((geojson) => {
            let countryCoords = getCountryCoordinates(
              geojson,
              country1,
              country2
            );
            if (!countryCoords) {
              countryCoords = getCountryCoordinates(
                geojson,
                country2,
                country1
              );
              if (countryCoords) {
                [country1, country2] = [country2, country1];
              }
            }

            if (countryCoords) {
              const midpoint = getMidpoint(countryCoords[0], countryCoords[1]);
              map.setCenter(midpoint);
              map.setZoom(3); // Adjust zoom level as needed

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
                filter: [
                  "in",
                  ["get", "COUNTRY_NAME"],
                  ["literal", selectedCountries],
                ],
              });

              updateHighlightFilter(map);
            } else {
              console.error(
                "Could not find coordinates for one or both of the selected countries."
              );
            }
          })
          .catch((error) =>
            console.error("Error loading allCountryCoordinates.geojson:", error)
          );
      });

      selectedCountries.push(country1, country2);

      fetchRelationshipSummary(country1, country2)
        .then((summary) => {
          if (summary) {
            document.getElementById("relationship-summary").innerHTML = summary;
          } else {
            return fetchRelationshipSummary(country2, country1).then(
              (swappedSummary) => {
                if (swappedSummary) {
                  [country1, country2] = [country2, country1];
                  document.getElementById("relationship-summary").innerHTML =
                    swappedSummary;
                } else {
                  console.error(
                    "No relationship summary found for the selected countries."
                  );
                  document.getElementById("relationship-summary").innerHTML =
                    "No relationship summary found for the selected countries.";
                }
              }
            );
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
            // Sort data by year
            data.sort((a, b) => {
              const yearA = parseInt(a.year.split("-")[0]);
              const yearB = parseInt(b.year.split("-")[0]);
              return yearA - yearB;
            });

            const eventIDs = data.map((entry) => entry._id);
            localStorage.setItem("eventIDs", JSON.stringify(eventIDs));

            data.forEach((entry) => {
              localStorage.setItem(entry._id, entry.year); // Store year with ID
            });

            generateTimelineEntries(data, country1, country2); // Pass country1 and country2
          } else {
            return fetchTimeline(country2, country1).then((swappedData) => {
              if (swappedData && swappedData.length > 0) {
                [country1, country2] = [country2, country1];
                // Sort data by year
                swappedData.sort((a, b) => {
                  const yearA = parseInt(a.year.split("-")[0]);
                  const yearB = parseInt(b.year.split("-")[0]);
                  return yearA - yearB;
                });

                const eventIDs = swappedData.map((entry) => entry._id);
                localStorage.setItem("eventIDs", JSON.stringify(eventIDs));

                swappedData.forEach((entry) => {
                  localStorage.setItem(entry._id, entry.year); // Store year with ID
                });

                generateTimelineEntries(swappedData, country1, country2); // Pass country1 and country2
              } else {
                console.error(
                  "No timeline data found for the selected countries."
                );
              }
            });
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
        return null;
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
        return null;
      }
    });
}

function updateHighlightFilter(map) {
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

// Modified generateTimelineEntries to use goToTimelineEvent
function generateTimelineEntries(timelineData, country1, country2) {
  const container = document.getElementById("timeline-container");
  container.innerHTML = ""; // Clear existing entries

  timelineData.forEach((entry) => {
    let displayYear = entry.year;
    if (entry.text.startsWith("s ")) {
      displayYear += "s";
      entry.text = entry.text.substring(2).trim(); // Remove the "s " from the text
    }

    const div = document.createElement("div");
    div.className = "timeline-entry";
    div.onclick = () => goToTimelineEvent(country1, country2, entry.year); // Pass country1, country2, and year when entry is clicked
    div.innerHTML = `
      <div class="timeline-year">${displayYear}</div>
      <div class="timeline-text">${entry.text}</div>
    `;
    container.appendChild(div);
  });
}

// New goToTimelineEvent function
function goToTimelineEvent(country1, country2, year) {
  fetch(
    `http://localhost:3000/api/getEventDetailsId?country1=${encodeURIComponent(
      country1
    )}&country2=${encodeURIComponent(country2)}&year=${encodeURIComponent(
      year
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data._id) {
        window.location.href = `event.html?_id=${encodeURIComponent(
          data._id
        )}&year=${encodeURIComponent(year)}`;
      } else {
        showEventErrorPopup(); // Show error popup if no corresponding event is found
      }
    })
    .catch((error) => {
      console.error("Error fetching event details ID:", error);
      showEventErrorPopup(); // Show error popup if there's an error in fetching the ID
    });
}

function showEventErrorPopup() {
  document.getElementById("event-error-popup").style.display = "flex";

  document.getElementById("close-event-popup-button").onclick = function () {
    document.getElementById("event-error-popup").style.display = "none";
  };
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

function getCountryCoordinates(geojson, country1, country2) {
  let country1Coords = null;
  let country2Coords = null;

  geojson.features.forEach((feature) => {
    // Compare with country1
    if (feature.properties.COUNTRY_NAME === country1) {
      country1Coords = feature.geometry.coordinates;
    }

    // Compare with country2
    if (feature.properties.COUNTRY_NAME === country2) {
      country2Coords = feature.geometry.coordinates;
    }
  });

  if (!country1Coords) {
    console.error(`Could not find coordinates for country: ${country1}`);
  }
  if (!country2Coords) {
    console.error(`Could not find coordinates for country: ${country2}`);
  }

  return country1Coords && country2Coords
    ? [country1Coords, country2Coords]
    : null;
}

function getMidpoint(coords1, coords2) {
  const lat1 = coords1[1];
  const lon1 = coords1[0];
  const lat2 = coords2[1];
  const lon2 = coords2[0];

  const midpointLat = (lat1 + lat2) / 2;
  const midpointLon = (lon1 + lon2) / 2;

  return [midpointLon, midpointLat];
}
