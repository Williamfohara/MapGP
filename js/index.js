document.addEventListener("DOMContentLoaded", function () {
  const backendUrl = "https://map-gp-node-backend.vercel.app"; // Replace with your actual backend URL

  // Fetch the configuration from the backend using Axios
  axios
    .get("https://map-gp-node-backend.vercel.app/api/config")
    .then((response) => {
      const config = response.data;

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

        // Initialize map features and event handlers after the map is fully loaded
        initializeMapFeatures();
      });
    })
    .catch((error) => console.error("Error fetching Mapbox API Key:", error));
});

function initializeMapFeatures() {
  // Rotation controls
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

  map.on("click", "countries-layer", function (e) {
    if (e.features.length > 0) {
      var countryName = e.features[0].properties.COUNTRY_NAME;
      var index = selectedCountries.indexOf(countryName);
      if (index === -1 && selectedCountries.length < 2) {
        selectedCountries.push(countryName);
      } else if (index !== -1) {
        selectedCountries.splice(index, 1);
      }

      // Update search bar values based on the state of selectedCountries
      document.getElementById("search-bar-1").value =
        selectedCountries.length > 0 ? selectedCountries[0] : "";
      document.getElementById("search-bar-2").value =
        selectedCountries.length > 1 ? selectedCountries[1] : "";

      updateHighlightFilter();
    }
  });

  // Begin the spinning interaction
  spinGlobe();
}

let selectedCountries = [];

function updateHighlightFilter() {
  if (map && selectedCountries.length) {
    map.setFilter("highlight-layer", [
      "in",
      ["get", "COUNTRY_NAME"],
      ["literal", selectedCountries],
    ]);
  }
}

function handleCountrySelection() {
  const country1 = document.getElementById("search-bar-1").value.trim();
  const country2 = document.getElementById("search-bar-2").value.trim();

  selectedCountries = [];
  if (country1) selectedCountries.push(country1);
  if (country2) selectedCountries.push(country2);

  updateHighlightFilter();
}

document
  .getElementById("search-bar-1")
  .addEventListener("input", handleCountrySelection);
document
  .getElementById("search-bar-2")
  .addEventListener("input", handleCountrySelection);

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
          if (response) {
            [country1, country2] = [country2, country1];
          }
        }

        if (response) {
          const timelineExists = await checkTimelineExists(country1, country2);
          if (timelineExists) {
            localStorage.setItem("relationshipSummary", response);
            window.location.href = `overview.html?country1=${encodeURIComponent(
              country1
            )}&country2=${encodeURIComponent(country2)}`;
          } else {
            // Show timeline error popup
            showTimelineErrorPopup(country1, country2);
          }
        } else {
          // Show summary error popup
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
    .post(
      "https://map-gp-node-backend.vercel.app/api/generate-missing-summary",
      {
        country1: country1,
        country2: country2,
      }
    )
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

  return axios
    .post(
      "https://map-gp-node-backend.vercel.app/api/generate-missing-timeline",
      {
        country1: country1,
        country2: country2,
      }
    )
    .then(() => {
      generateTimelineButton.innerText = "Timeline Generated"; // Update text on success
      alert("Timeline generated successfully.");
    })
    .catch((error) => {
      generateTimelineButton.innerText = "Generate Timeline"; // Revert text on failure
      console.error("Error generating timeline:", error);
      alert(
        "An error occurred while generating the timeline. Please try again later."
      );
    });
}

async function fetchRelationshipSummary(country1, country2) {
  try {
    const response = await axios.get(
      `https://map-gp-node-backend.vercel.app/api/relationship-summary`,
      {
        params: { country1, country2 },
      }
    );
    if (response.data.relationshipSummary) {
      return response.data.relationshipSummary;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching relationship summary:", error);
    return null;
  }
}

async function checkTimelineExists(country1, country2) {
  try {
    let response = await axios.get(
      `https://map-gp-node-backend.vercel.app/api/timeline?country1=${encodeURIComponent(
        country1
      )}&country2=${encodeURIComponent(country2)}`
    );
    if (response.data && response.data.length > 0) {
      return true;
    } else {
      response = await axios.get(
        `https://map-gp-node-backend.vercel.app/api/timeline?country1=${encodeURIComponent(
          country2
        )}&country2=${encodeURIComponent(country1)}`
      );
      return response.data && response.data.length > 0;
    }
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
