let map; // Declare map globally
let eventIDs = []; // Declare eventIDs globally
let currentEventID = null; // Declare currentEventID globally

document.addEventListener("DOMContentLoaded", async function () {
  const backendUrl = process.env.BACKEND_URL; // Fetch backend URL from environment variable
  const mapboxApiKey = process.env.MAPBOX_API_KEY; // Fetch Mapbox API key from environment variable
  const openAiApiKey = process.env.OPENAI_API_KEY; // Fetch OpenAI API key from environment variable

  try {
    // Initialize the map using Mapbox API key
    mapboxgl.accessToken = mapboxApiKey;

    // Initialize the map
    console.log("Initializing map...");
    map = new mapboxgl.Map({
      container: "map",
      zoom: 4.4,
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

    // Fetch event details from the backend using the _id
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
    const places = await extractLocationsFromText(text, openAiApiKey);

    if (places.length > 0) {
      const coordinates = await getCoordinatesForLocations(
        places,
        mapboxApiKey
      );
      addMarkersToMap(coordinates);
    } else {
      console.log("No locations found in the text.");
    }

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

// Extract locations from text using OpenAI API
async function extractLocationsFromText(text, apiKey) {
  const openAiUrl = "https://api.openai.com/v1/completions";
  const prompt = `Extract place names from the following text: ${text}`;

  try {
    const response = await fetch(openAiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, // Pass OpenAI API key from environment variables
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices[0].text
      .trim()
      .split(",")
      .map((location) => location.trim());
  } catch (error) {
    console.error("Error extracting locations:", error);
    return [];
  }
}

// Get coordinates for locations using Mapbox API
async function getCoordinatesForLocations(locations, apiKey) {
  const coordinates = [];

  for (let location of locations) {
    try {
      const geocodeResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?access_token=${apiKey}`
      );
      const data = await geocodeResponse.json();

      if (data.features && data.features.length > 0) {
        const { center } = data.features[0]; // Get the first result's coordinates
        coordinates.push({
          place: location,
          coordinates: center,
        });
      }
    } catch (error) {
      console.error(`Error fetching coordinates for ${location}:`, error);
    }
  }

  return coordinates;
}

// Add markers to the map
function addMarkersToMap(coordinates) {
  coordinates.forEach(({ place, coordinates }) => {
    const marker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${place}</h3>`)) // Add a popup
      .addTo(map);
  });
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
