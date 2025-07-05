let map; // Declare map globally
let eventIDs = []; // Declare eventIDs globally
let currentEventID = null; // Declare currentEventID globally

const backendUrl = ""; // Replace with your actual backend URL

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Fetch the configuration from the backend
    console.log("Fetching Mapbox API Key configuration...");
    const configResponse = await fetch(`${backendUrl}/api/configMAPBOX_API`);
    if (!configResponse.ok) {
      throw new Error(`HTTP error! status: ${configResponse.status}`);
    }
    const config = await configResponse.json();
    console.log("Mapbox API Key fetched:", config.mapboxApiKey);

    // Use the fetched Mapbox access token
    mapboxgl.accessToken = config.mapboxApiKey;

    // Initialize the map
    console.log("Initializing map...");
    map = new mapboxgl.Map({
      container: "map",
      zoom: 1.0,
      center: [-103, 23],
      style: "mapbox://styles/pjfry/clnger6op083e01qxargvhm65",
      projection: "globe",
      scrollZoom: false,
      dragRotate: false,
    });

    map.on("style.load", () => {
      console.log("Map style loaded.");
      map.setFog({});
    });

    // Proceed to load event details
    const urlParams = new URLSearchParams(window.location.search);
    const _id = urlParams.get("_id");
    console.log("Event ID from URL:", _id);

    if (!_id) {
      throw new Error("Event ID is missing from URL parameters.");
    }

    // Fetch event details from the eventDetails collection using the _id
    console.log("Fetching event details...");
    const response = await fetch(
      `${backendUrl}/api/event-details?_id=${encodeURIComponent(_id)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched event details data:", data);

    // Initialize eventIDs and currentEventID with the data from the response
    eventIDs = data.allEventIDs; // This should now include all relevant event IDs
    currentEventID = _id;

    await loadEventOverlays("1763_treaty_of_paris");

    console.log("All Event IDs:", eventIDs); // Log all event IDs
    console.log("Current Event ID:", currentEventID);

    // Check if the response contains the expected event details
    if (
      !data ||
      typeof data.eventDetails !== "string" ||
      !data.eventDetails.trim()
    ) {
      throw new Error("Event details are missing from the response.");
    }

    // Extract the first line of event details to display in the h3 tag
    const eventDetailsLines = data.eventDetails.split("<br>");
    const firstLine = eventDetailsLines[0];
    const remainingDetails = eventDetailsLines.slice(1).join("<br>");
    document.getElementById("info-panel").innerHTML = `
      <h3>${firstLine}</h3>
      <p>${remainingDetails}</p>
    `;

    // Dynamically add the purple overlay after loading the content
    const purpleOverlay = document.createElement("div");
    purpleOverlay.id = "purple-overlay";
    document.getElementById("info-panel").appendChild(purpleOverlay);

    // Update the top-right-box with the event year from the data object
    const topRightBox = document.getElementById("top-right-box");
    if (data.eventYear) {
      topRightBox.innerText = data.eventYear; // Set the year from the data object
    } else {
      topRightBox.innerText = "Year not available";
    }

    // Adjust the width of the top-right-box based on input
    adjustTopRightBoxWidth(topRightBox);

    // Extract and map geographic locations from the text
    const text = `${firstLine} ${remainingDetails}`;

    // ✅ Move this here so text is in scope
    await displayKeyCountries(text);

    // Attach event handlers to navigation buttons
    document.getElementById("prevEvent").onclick = navigateToPreviousEvent;
    document.getElementById("nextEvent").onclick = navigateToNextEvent;
    console.log("Event handlers attached to navigation buttons.");
  } catch (error) {
    console.error("Failed to fetch event details or Mapbox API Key:", error);
    document.getElementById("info-panel").innerHTML = `
      <h3>Event Details</h3>
      <p>Error loading event details or accessing Mapbox API.</p>
    `;
  }

  // Add feedback form logic
  const feedbackButton = document.getElementById("feedback-button");
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackText = document.getElementById("feedback-text");
  const submitFeedbackButton = document.getElementById("submit-feedback");
  const cancelFeedbackButton = document.getElementById("cancel-feedback");

  // Show the feedback form when the feedback button is clicked
  feedbackButton.addEventListener("click", function () {
    feedbackForm.style.display = "block";
    feedbackButton.style.display = "none"; // Hide the button when form is shown
  });

  // Handle the submission of feedback
  submitFeedbackButton.addEventListener("click", async function () {
    const feedback = feedbackText.value.trim();
    if (!feedback) {
      alert("Please enter your feedback.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/submit-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }

      alert("Thank you for your feedback!");
      feedbackForm.style.display = "none";
      feedbackButton.style.display = "block";
      feedbackText.value = ""; // Clear the textarea
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert(
        "There was an error submitting your feedback. Please try again later."
      );
    }
  });

  // Handle canceling the feedback form
  cancelFeedbackButton.addEventListener("click", function () {
    feedbackForm.style.display = "none";
    feedbackButton.style.display = "block";
    feedbackText.value = ""; // Clear the textarea
  });
});

function adjustTopRightBoxWidth(element) {
  if (!element) return;
  // Reset width to auto to calculate content width
  element.style.width = "auto";
  const width = element.clientWidth;
  // Set the calculated width and ensure it doesn't exceed the viewport
  element.style.width = width + "px";
  element.style.maxWidth = `calc(100% - ${element.offsetLeft + 10}px)`;
}

async function loadEventOverlays(eventSlug) {
  const manifestUrl = `/data/eventOverlays/${eventSlug}/manifest.json`;
  const response = await fetch(manifestUrl);
  const manifestData = await response.json();
  const overlays = manifestData.overlays;

  let allFeatures = [];

  for (let index = 0; index < overlays.length; index++) {
    const overlay = overlays[index];
    const sourceId = `${eventSlug}-source-${index}`;
    const layerId = `${eventSlug}-layer-${index}`;
    const geojsonUrl = `/data/eventOverlays/${eventSlug}/${overlay.file}`;

    const geojsonRes = await fetch(geojsonUrl);
    const geojson = await geojsonRes.json();
    allFeatures.push(...geojson.features);

    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#ffaa00",
        "fill-opacity": 0.4,
      },
    });
  }

  // Combine all features into one bounding box
  if (allFeatures.length > 0) {
    const bbox = turf.bbox({
      type: "FeatureCollection",
      features: allFeatures,
    });
    map.fitBounds(bbox, { padding: 40, duration: 1000 });
  }
}

function navigateToPreviousEvent() {
  console.log("Navigating to previous event...");
  const currentIndex = eventIDs.indexOf(currentEventID);
  console.log("Current Index:", currentIndex);
  console.log("Total Events:", eventIDs.length);
  if (currentIndex > 0) {
    const previousEventID = eventIDs[currentIndex - 1];
    console.log("Previous Event ID:", previousEventID);
    const previousEventYear = localStorage.getItem(`year_${previousEventID}`); // Get year from local storage
    console.log("Previous Event Year from localStorage:", previousEventYear);
    window.location.href = `/html/event.html?_id=${encodeURIComponent(
      previousEventID
    )}&year=${encodeURIComponent(previousEventYear)}`;
  } else {
    console.log("No previous event available.");
  }
}

function navigateToNextEvent() {
  console.log("Navigating to next event...");
  const currentIndex = eventIDs.indexOf(currentEventID);
  console.log("Current Index:", currentIndex);
  console.log("Total Events:", eventIDs.length);
  if (currentIndex < eventIDs.length - 1) {
    const nextEventID = eventIDs[currentIndex + 1];
    console.log("Next Event ID:", nextEventID);
    const nextEventYear = localStorage.getItem(`year_${nextEventID}`); // Get year from local storage
    console.log("Next Event Year from localStorage:", nextEventYear);
    window.location.href = `/html/event.html?_id=${encodeURIComponent(
      nextEventID
    )}&year=${encodeURIComponent(nextEventYear)}`;
  } else {
    console.log("No next event available.");
  }
}

async function displayKeyCountries(text) {
  // keep header box untouched
  const list = document.getElementById("countries-list");
  list.innerHTML = ""; // clear previous pills

  try {
    const res = await fetch(`${backendUrl}/api/extract-key-countries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();

    if (!data.countries?.length) {
      list.innerHTML = "<em>No countries identified.</em>";
      return;
    }

    data.countries.forEach((country) => {
      const pill = document.createElement("div");
      pill.className = "key-player-country";
      pill.textContent = country;
      list.appendChild(pill);
    });
  } catch (err) {
    console.error("Error fetching key countries:", err);
    list.innerHTML = "<em>Failed to load countries.</em>";
  }
}
