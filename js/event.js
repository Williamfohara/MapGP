let map; // Declare map globally
let eventIDs = []; // Declare eventIDs globally
let currentEventID = null; // Declare currentEventID globally

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Fetch the configuration from the backend
    const configResponse = await fetch("http://localhost:3000/api/config");
    if (!configResponse.ok) {
      throw new Error(`HTTP error! status: ${configResponse.status}`);
    }
    const config = await configResponse.json();

    // Use the fetched Mapbox access token
    mapboxgl.accessToken = config.mapboxAccessToken;

    // Initialize the map
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
      map.setFog({});
    });

    // Proceed to load event details
    const urlParams = new URLSearchParams(window.location.search);
    const _id = urlParams.get("_id");
    const eventYear = urlParams.get("year");

    if (!_id) {
      throw new Error("Event ID is missing from URL parameters.");
    }

    // Fetch event details from the eventDetails collection using the _id
    const response = await fetch(
      `http://localhost:3000/event-details?_id=${encodeURIComponent(_id)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Log the entire data object to verify its structure
    console.log("Fetched data:", data);

    // Initialize eventIDs and currentEventID with the data from the response
    eventIDs = data.allEventIDs;
    currentEventID = _id;

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

    // Update the top-right-box with the event year
    const topRightBox = document.getElementById("top-right-box");
    if (eventYear) {
      topRightBox.innerText = eventYear;
    } else {
      topRightBox.innerText = "Year not available";
    }

    // Adjust the width of the top-right-box based on input
    adjustTopRightBoxWidth(topRightBox);

    // Attach event handlers to navigation buttons
    document.getElementById("prevEvent").onclick = navigateToPreviousEvent;
    document.getElementById("nextEvent").onclick = navigateToNextEvent;
  } catch (error) {
    console.error("Failed to fetch event details or Mapbox API Key:", error);
    document.getElementById("info-panel").innerHTML = `
      <h3>Event Details</h3>
      <p>Error loading event details or accessing Mapbox API.</p>
    `;
  }
});

function adjustTopRightBoxWidth(element) {
  // Adjust the width of the top-right-box dynamically
  element.style.width = "auto"; // Let the browser resize it to fit content
  const width = element.clientWidth;
  element.style.width = width + "px"; // Set the width to fit content
  element.style.maxWidth = `calc(100% - ${element.offsetLeft + 10}px)`; // Ensure it doesn't touch the right edge
}

function navigateToPreviousEvent() {
  const currentIndex = eventIDs.indexOf(currentEventID);
  if (currentIndex > 0) {
    const previousEventID = eventIDs[currentIndex - 1];
    const previousEventYear = localStorage.getItem(previousEventID); // Get year from local storage
    window.location.href = `event.html?_id=${encodeURIComponent(
      previousEventID
    )}&year=${encodeURIComponent(previousEventYear)}`;
  }
}

function navigateToNextEvent() {
  const currentIndex = eventIDs.indexOf(currentEventID);
  if (currentIndex < eventIDs.length - 1) {
    const nextEventID = eventIDs[currentIndex + 1];
    const nextEventYear = localStorage.getItem(nextEventID); // Get year from local storage
    window.location.href = `event.html?_id=${encodeURIComponent(
      nextEventID
    )}&year=${encodeURIComponent(nextEventYear)}`;
  }
}
