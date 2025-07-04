// Declare backendUrl globally at the top of your script
const backendUrl = ""; // Your backend URL

document.addEventListener("DOMContentLoaded", function () {
  // Show the instructional popup on first load
  const instructionsPopup = document.getElementById("instructions-popup");
  const closeInstructionsButton = document.getElementById(
    "close-instructions-button"
  );
  const infoButton = document.getElementById("info-button");

  // Display the popup when the page loads (for first-time users)
  instructionsPopup.style.display = "flex";

  // Dismiss the popup when the "Got it!" button is clicked
  closeInstructionsButton.addEventListener("click", function () {
    instructionsPopup.style.display = "none";
  });

  // Show the instructional popup when the info button is clicked
  infoButton.addEventListener("click", function () {
    instructionsPopup.style.display = "flex";
  });

  // Fetch the configuration from the backend using Axios
  axios
    .get(`${backendUrl}/api/configMAPBOX_API`)
    .then((response) => {
      const config = response.data;

      // Use the fetched Mapbox access token
      mapboxgl.accessToken = config.mapboxApiKey;

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

        // Initialize map features and event handlers after the map is fully loaded
        initializeMapFeatures();
      });
    })
    .catch((error) => console.error("Error fetching Mapbox API Key:", error));
});

let firstCountry = null;
let secondCountry = null;

function initializeMapFeatures() {
  const secondsPerRevolution = 120;
  const maxSpinZoom = 5;
  const slowSpinZoom = 3;

  let userInteracting = false;
  let spinEnabled = true;

  function spinGlobe() {
    if (spinEnabled && !userInteracting) {
      const zoom = map.getZoom();
      if (zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        map.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }
  }

  // Event listeners for user interactions
  map.on("mousedown", () => {
    userInteracting = true;
  });
  map.on("mouseup", () => {
    userInteracting = false;
    spinGlobe();
  });
  map.on("dragend", () => {
    userInteracting = false;
    spinGlobe();
  });
  map.on("pitchend", () => {
    userInteracting = false;
    spinGlobe();
  });
  map.on("rotateend", () => {
    userInteracting = false;
    spinGlobe();
  });
  map.on("moveend", () => {
    spinGlobe();
  });

  // Event listener for country selection and highlighting
  map.on("click", "countries-layer", function (e) {
    if (e.features.length > 0) {
      var countryName = e.features[0].properties.COUNTRY_NAME;
      handleCountrySelection(countryName);
    }
  });

  spinGlobe();
}

function handleCountrySelection(countryName) {
  if (!firstCountry && !secondCountry) {
    firstCountry = countryName; // Assign to the first slot
  } else if (!secondCountry && firstCountry !== countryName) {
    secondCountry = countryName; // Assign to the second slot
  } else if (firstCountry === countryName) {
    firstCountry = null; // Deselect the first country
  } else if (secondCountry === countryName) {
    secondCountry = null; // Deselect the second country
  }

  updateHighlightFilter();
  updateCountryInputs();
}

function updateHighlightFilter() {
  // Update the first highlight layer for the first country
  map.setFilter("highlight-layer-1", [
    "in",
    ["get", "COUNTRY_NAME"],
    ["literal", firstCountry ? [firstCountry] : []],
  ]);

  // Update the second highlight layer for the second country
  map.setFilter("highlight-layer-2", [
    "in",
    ["get", "COUNTRY_NAME"],
    ["literal", secondCountry ? [secondCountry] : []],
  ]);
}

function updateCountryInputs() {
  document.getElementById("search-bar-1").value = firstCountry || "";
  document.getElementById("search-bar-2").value = secondCountry || "";
}

document
  .getElementById("search-bar-1")
  .addEventListener("input", handleManualCountrySelection);
document
  .getElementById("search-bar-2")
  .addEventListener("input", handleManualCountrySelection);

function handleManualCountrySelection() {
  const country1 = document.getElementById("search-bar-1").value.trim();
  const country2 = document.getElementById("search-bar-2").value.trim();

  firstCountry = country1 || null;
  secondCountry = country2 || null;

  updateHighlightFilter();
}

document
  .querySelector(".view-button")
  .addEventListener("click", async function () {
    let country1 = document.getElementById("search-bar-1").value.trim();
    let country2 = document.getElementById("search-bar-2").value.trim();

    if (country1 && country2) {
      try {
        let response = await fetchRelationshipSummary(country1, country2);
        if (!response) {
          response = await fetchRelationshipSummary(country2, country1);
          if (response) [country1, country2] = [country2, country1];
        }
        if (response) {
          const timelineExists = await checkTimelineExists(country1, country2);
          if (timelineExists) {
            localStorage.setItem("relationshipSummary", response);
            window.location.href = `/html/overview.html?country1=${encodeURIComponent(
              country1
            )}&country2=${encodeURIComponent(country2)}`;
          } else {
            showTimelineErrorPopup(country1, country2);
          }
        } else {
          showSummaryErrorPopup(country1, country2);
        }
      } catch (error) {
        console.error("Error fetching relationship summary:", error);
        alert(
          "An error occurred while fetching the relationship summary. Please try again later."
        );
      }
    } else {
      alert("Please select two countries before viewing the overview.");
    }
  });

document
  .getElementById("close-summary-popup-button")
  .addEventListener("click", function () {
    document.getElementById("summary-error-popup").style.display = "none";
  });

document
  .getElementById("close-timeline-popup-button")
  .addEventListener("click", function () {
    document.getElementById("timeline-error-popup").style.display = "none";
  });

function generateSummary(country1, country2) {
  const generateSummaryButton = document.getElementById(
    "generate-summary-button"
  );
  generateSummaryButton.innerText = "Generating..."; // Change button text to "Generating..."

  return axios
    .post(`${backendUrl}/api/generate-missing-summary`, {
      country1: country1,
      country2: country2,
    })
    .then(() => {
      generateSummaryButton.innerText = "Summary Generated"; // Update text on success
      alert("Summary generated successfully. Click the View button again.");
    })
    .catch((error) => {
      generateSummaryButton.innerText = "Generate Summary"; // Revert text on failure
      console.error("Error generating summary:", error);
      alert(
        "An error occurred while generating the summary. Please try again later."
      );
    });
}

function generateTimeline(country1, country2) {
  const generateTimelineButton = document.getElementById(
    "generate-timeline-button"
  );
  generateTimelineButton.innerText = "Generating..."; // Change button text to "Generating..."

  // Integrating the axios call to generate the timeline
  return axios
    .post(`${backendUrl}/api/generate-missing-timeline`, {
      country1: country1,
      country2: country2,
    })
    .then((response) => {
      console.log("Timeline generated successfully:", response.data); // Log success
      generateTimelineButton.innerText = "Timeline Generated"; // Update text on success
      alert("Timeline generated successfully.");
    })
    .catch((error) => {
      console.error(
        "Error generating timeline:",
        error.response || error.message
      ); // Log error
      generateTimelineButton.innerText = "Generate Timeline"; // Revert text on failure
      alert(
        "An error occurred while generating the timeline. Please try again later."
      );
    });
}

async function fetchRelationshipSummary(country1, country2) {
  try {
    const response = await axios.get(`${backendUrl}/api/mongo-query-config`, {
      params: { country1, country2 },
    });
    return response.data.relationshipSummary || null;
  } catch (error) {
    console.error("Error fetching relationship summary:", error);
    return null;
  }
}

async function checkTimelineExists(country1, country2) {
  try {
    let response = await axios.get(
      `${backendUrl}/api/timeline?country1=${encodeURIComponent(
        country1
      )}&country2=${encodeURIComponent(country2)}`
    );
    if (response.data && response.data.length > 0) {
      return true;
    }
    response = await axios.get(
      `${backendUrl}/api/timeline?country1=${encodeURIComponent(
        country2
      )}&country2=${encodeURIComponent(country1)}`
    );
    return response.data && response.data.length > 0;
  } catch (error) {
    console.error("Error checking timeline:", error);
    return false;
  }
}

function showSummaryErrorPopup(country1, country2) {
  document.getElementById("summary-error-popup").style.display = "flex";

  document.getElementById("generate-summary-button").onclick =
    async function () {
      await generateSummary(country1, country2);
      document.getElementById("summary-error-popup").style.display = "none";
    };
}

function showTimelineErrorPopup(country1, country2) {
  document.getElementById("timeline-error-popup").style.display = "flex";

  document.getElementById("generate-timeline-button").onclick =
    async function () {
      await generateTimeline(country1, country2);
      document.getElementById("timeline-error-popup").style.display = "none";
    };
}
