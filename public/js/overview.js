// Define backendUrl globally at the top of the script
const backendUrl = ""; // Your backend URL
let isGenerating = false; // Flag to prevent concurrent submissions

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

  fetch(`${backendUrl}/api/configMAPBOX_API`)
    .then((response) => response.json())
    .then((config) => {
      mapboxgl.accessToken = config.mapboxApiKey;

      // Initialize the map
      const map = new mapboxgl.Map({
        container: "map",
        zoom: 1.5,
        center: [-90, 40],
        style: "mapbox://styles/pjfry/clnger6op083e01qxargvhm65",
        projection: "globe",
      });

      map.on("load", () => {
        map.setFog({});

        // Fetch country coordinates from GeoJSON and apply them to the map
        fetch("/data/countryCoordinates/allCountryCoordinates.geojson")
          .then((response) => response.json())
          .then((geojson) => {
            if (!geojson || !geojson.features) {
              console.error("Invalid GeoJSON data.");
              return;
            }

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
              const distance = calculateDistance(
                countryCoords[0],
                countryCoords[1]
              );
              const zoomLevel = determineZoomLevel(distance);

              map.setCenter(midpoint);
              map.setZoom(zoomLevel);

              map.addSource("countries", {
                type: "geojson",
                data: "../data/countries.geojson",
              });

              // Base layer for countries
              map.addLayer({
                id: "countries-layer",
                type: "fill",
                source: "countries",
                layout: {},
                paint: {
                  "fill-color": "#a0d6ff", // Light blue base layer color for non-selected countries
                  "fill-opacity": 0.2, // Semi-transparent for non-selected countries
                },
              });

              // Highlight layer for the first selected country
              map.addLayer({
                id: "highlight-layer-1",
                type: "fill",
                source: "countries",
                layout: {},
                paint: {
                  "fill-color": "#ff6b6b", // Vibrant pink or red for first selected country
                  "fill-opacity": 0.8, // Opaque to make the first selected country pop
                },
                filter: ["in", ["get", "COUNTRY_NAME"], ["literal", []]],
              });

              // Highlight layer for the second selected country
              map.addLayer({
                id: "highlight-layer-2",
                type: "fill",
                source: "countries",
                layout: {},
                paint: {
                  "fill-color": "#ffeb75", // Vibrant yellow for the second selected country
                  "fill-opacity": 0.8, // Opaque to make the second selected country pop
                },
                filter: ["in", ["get", "COUNTRY_NAME"], ["literal", []]],
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

      // Fetch relationship summary
      fetchWithCountrySwap(fetchRelationshipSummary, country1, country2).then(
        ({ data: summary }) => {
          if (summary) {
            document.getElementById("relationship-summary").innerHTML = summary;
          } else {
            console.error(
              "No relationship summary found for the selected countries."
            );
          }
        }
      );

      // Fetch timeline data
      fetchWithCountrySwap(fetchTimeline, country1, country2).then(
        ({ data: timelineData, swapped }) => {
          if (timelineData) {
            generateTimelineEntries(
              timelineData,
              swapped ? country2 : country1,
              swapped ? country1 : country2
            );
          } else {
            console.error("No timeline data found for the selected countries.");
          }
        }
      );
    })
    .catch((error) => console.error("Error fetching Mapbox API Key:", error));

  // Event listener for the new "Generate All Events" button
  const generateAllEventsButton = document.getElementById(
    "generate-all-events-button"
  );
  generateAllEventsButton.onclick = function () {
    generateAllEvents();
  };

  // Info button and instructions popup
  const infoButton = document.getElementById("info-button");
  const instructionsPopup = document.getElementById("instructions-popup");
  const closeInstructionsButton = document.getElementById(
    "close-instructions-button"
  );

  infoButton.addEventListener("click", function () {
    instructionsPopup.style.display = "flex";
  });

  closeInstructionsButton.addEventListener("click", function () {
    instructionsPopup.style.display = "none";
  });
});

let selectedCountries = [];

function fetchRelationshipSummary(country1, country2) {
  return fetch(
    `${backendUrl}/api/relationship-summary?country1=${encodeURIComponent(
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
    `${backendUrl}/api/timeline?country1=${encodeURIComponent(
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

function fetchWithCountrySwap(fetchFunction, country1, country2) {
  return fetchFunction(country1, country2)
    .then((data) => {
      if (data && data.length > 0) {
        return { data, swapped: false }; // Data found in original order
      } else {
        return fetchFunction(country2, country1).then((swappedData) => {
          if (swappedData && swappedData.length > 0) {
            return { data: swappedData, swapped: true }; // Data found in swapped order
          } else {
            return { data: null, swapped: false }; // No data found in either order
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error during fetch with country swap:", error);
      return { data: null, swapped: false }; // Handle errors and return no data
    });
}

function updateHighlightFilter(map) {
  if (!map) {
    console.error("Map instance is not available");
    return;
  }

  if (typeof map.getLayer !== "function") {
    console.error(
      "map.getLayer is not a function. Ensure Mapbox GL JS is properly integrated."
    );
    return;
  }

  if (map.getLayer("highlight-layer-1") && map.getLayer("highlight-layer-2")) {
    map.setFilter("highlight-layer-1", [
      "in",
      ["get", "COUNTRY_NAME"],
      ["literal", selectedCountries.length > 0 ? [selectedCountries[0]] : []],
    ]);

    map.setFilter("highlight-layer-2", [
      "in",
      ["get", "COUNTRY_NAME"],
      ["literal", selectedCountries.length > 1 ? [selectedCountries[1]] : []],
    ]);
  } else {
    console.error("highlight-layer-1 or highlight-layer-2 does not exist");
  }
}

function getCountryCoordinates(geojson, country1, country2) {
  let country1Coords = null;
  let country2Coords = null;

  if (!geojson || !geojson.features) {
    console.error("Invalid GeoJSON structure.");
    return null;
  }

  geojson.features.forEach((feature) => {
    if (feature.properties && feature.properties.COUNTRY_NAME === country1) {
      country1Coords = feature.geometry.coordinates;
    }

    if (feature.properties && feature.properties.COUNTRY_NAME === country2) {
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

function calculateDistance(coord1, coord2) {
  const lat1 = coord1[1];
  const lon1 = coord1[0];
  const lat2 = coord2[1];
  const lon2 = coord2[0];

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

function determineZoomLevel(distance) {
  if (distance < 500) {
    return 6; // Closest (More zoomed in)
  } else if (distance < 1500) {
    return 5; // Close (More zoomed in)
  } else if (distance < 3000) {
    return 4; // Medium (More zoomed in)
  } else if (distance < 6000) {
    return 3; // Far (More zoomed in)
  } else {
    return 2; // Farthest (More zoomed in)
  }
}

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
    div.onclick = () => {
      selectTimelineEntry(div);
      goToTimelineEvent(country1, country2, entry.year);
    };
    div.innerHTML = `<div class="timeline-year">${displayYear}</div><div class="timeline-text">${entry.text}</div>`;
    container.appendChild(div);
  });
}

function selectTimelineEntry(entryDiv) {
  const allEntries = document.querySelectorAll(".timeline-entry");
  allEntries.forEach((entry) => entry.classList.remove("selected"));
  entryDiv.classList.add("selected");
}

function goToTimelineEvent(country1, country2, year) {
  console.log("Fetching event details ID with parameters:", {
    country1,
    country2,
    year,
  });

  fetch(
    `${backendUrl}/api/getEventDetailsId?country1=${encodeURIComponent(
      country1
    )}&country2=${encodeURIComponent(country2)}&year=${encodeURIComponent(
      year
    )}`
  )
    .then((response) => {
      console.log("Response status:", response.status);
      if (!response.ok) {
        console.error(
          "Failed to fetch event details. Response status:",
          response.status
        );
        throw new Error("Event not found or other server error");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data received:", data);
      if (data._id) {
        console.log(
          "Redirecting to event.html with ID and year:",
          data._id,
          year
        );
        window.location.href = `/html/event.html?_id=${encodeURIComponent(
          data._id
        )}&year=${encodeURIComponent(year)}`;
      } else {
        console.error("No event ID found in the response data.");
        showEventErrorPopup();
      }
    })
    .catch((error) => {
      console.error("Error fetching event details ID:", error);
      showEventErrorPopup();
    });
}

function showEventErrorPopup() {
  const popup = document.getElementById("event-error-popup");
  if (popup) {
    popup.style.display = "flex";

    const closeButton = document.getElementById("close-event-popup-button");
    if (closeButton) {
      closeButton.onclick = function () {
        popup.style.display = "none";
      };
    } else {
      console.error("Close button for event error popup not found.");
    }

    const generateButton = document.getElementById("generate-event-button");
    if (generateButton) {
      generateButton.onclick = function () {
        generateEvent();
      };
    } else {
      console.error("Generate button for event error popup not found.");
    }

    const generateAllEventsButton = document.getElementById(
      "generate-all-events-button"
    );
    if (generateAllEventsButton) {
      generateAllEventsButton.onclick = function () {
        generateAllEvents();
      };
    } else {
      console.error(
        "Generate All Events button for event error popup not found."
      );
    }
  } else {
    console.error("Event error popup element not found.");
  }
}

function generateEvent() {
  const generateEventButton = document.getElementById("generate-event-button");
  generateEventButton.innerText = "Generating..."; // Change button text to "Generating..."
  generateEventButton.disabled = true; // Disable the button to prevent further clicks

  const country1 = document.getElementById("country1-info").textContent;
  const country2 = document.getElementById("country2-info").textContent;
  const selectedTimelineEntry = document.querySelector(
    ".timeline-entry.selected .timeline-text"
  );

  if (!selectedTimelineEntry) {
    console.error("No timeline entry selected or missing text.");
    generateEventButton.innerText = "Generate Events"; // Revert button text
    generateEventButton.disabled = false; // Re-enable the button if no text is selected
    return;
  }

  const timelineEntryText = selectedTimelineEntry.textContent;
  const selectedTimelineYear = document.querySelector(
    ".timeline-entry.selected .timeline-year"
  );

  if (!selectedTimelineYear) {
    console.error("No timeline entry year selected or missing.");
    generateEventButton.innerText = "Generate Events"; // Revert button text
    generateEventButton.disabled = false; // Re-enable the button if no year is selected
    return;
  }

  const timelineEntryYear = selectedTimelineYear.textContent;

  console.log(
    "Generating event for:",
    country1,
    country2,
    timelineEntryText,
    timelineEntryYear
  );

  fetch(`${backendUrl}/api/generate-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country1,
      country2,
      text: timelineEntryText,
      year: timelineEntryYear,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to generate event");
      }
      return response.json();
    })
    .then((data) => {
      generateEventButton.innerText = "Event Generated"; // Update text on success
      console.log("Event generated successfully:", data);
    })
    .catch((error) => {
      generateEventButton.innerText = "Generate Events"; // Revert text on failure
      generateEventButton.disabled = false; // Re-enable button on failure
      console.error("Error generating event:", error);
    });
}

function generateAllEvents() {
  const generateAllEventsButton = document.getElementById(
    "generate-all-events-button"
  );
  if (isGenerating) return; // Prevent concurrent actions
  isGenerating = true;

  generateAllEventsButton.innerText = "Generating All Events..."; // Change button text
  generateAllEventsButton.disabled = true; // Disable the button to prevent further clicks

  console.log("Generating all events...");

  const country1 = document.getElementById("country1-info").textContent;
  const country2 = document.getElementById("country2-info").textContent;

  function fetchTimelineData(c1, c2) {
    return fetch(
      `${backendUrl}/api/timeline?country1=${encodeURIComponent(
        c1
      )}&country2=${encodeURIComponent(c2)}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch timeline data");
        }
        return response.json();
      })
      .then((timelineData) => {
        if (!Array.isArray(timelineData) || timelineData.length === 0) {
          return null;
        }
        return timelineData;
      })
      .catch((error) => {
        console.error(
          `Error fetching timeline data for ${c1} and ${c2}:`,
          error
        );
        return null;
      });
  }

  fetchTimelineData(country1, country2)
    .then((timelineData) => {
      if (!timelineData) {
        console.log(
          "No timeline data found for original country order, flipping countries..."
        );
        return fetchTimelineData(country2, country1).then(
          (swappedTimelineData) => {
            if (!swappedTimelineData) {
              throw new Error(
                "No timeline data found for either country order."
              );
            }
            return { timelineData: swappedTimelineData, flipped: true };
          }
        );
      }
      return { timelineData, flipped: false };
    })
    .then(({ timelineData, flipped }) => {
      const c1 = flipped ? country2 : country1;
      const c2 = flipped ? country1 : country2;

      const timelinePromises = timelineData.map((event) => {
        const { year, text } = event;

        return fetch(
          `${backendUrl}/api/getEventDetailsId?country1=${encodeURIComponent(
            c1
          )}&country2=${encodeURIComponent(c2)}&year=${encodeURIComponent(
            year
          )}`
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              console.log(
                `No event details found for year ${year}. Generating event...`
              );
              return fetch(`${backendUrl}/api/generate-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  country1: c1,
                  country2: c2,
                  text,
                  year,
                }),
              }).then((response) => {
                if (!response.ok) {
                  throw new Error(`Failed to generate event for year ${year}`);
                }
                return response.json();
              });
            }
          })
          .catch((error) => {
            console.error(
              `Error checking or generating event for year ${year}:`,
              error
            );
          });
      });

      return Promise.all(timelinePromises);
    })
    .then(() => {
      console.log("All events have been checked and generated (if needed).");
      alert("All events have been generated successfully!");
    })
    .catch((error) => {
      console.error("Error generating all events:", error);
      alert("Failed to generate all events: " + error.message);
    })
    .finally(() => {
      resetGenerateButton(generateAllEventsButton, true);
    });
}

function resetGenerateButton(button, disable = false) {
  button.innerText = "All Events Generated";
  if (disable) {
    button.disabled = true;
  }
  isGenerating = false;
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
