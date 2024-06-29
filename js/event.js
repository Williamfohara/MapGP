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

    console.log("Requesting event details for _id:", _id);

    const response = await fetch(
      `http://localhost:3000/event-details?_id=${encodeURIComponent(_id)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received event details:", data);

    // Retrieve event IDs from local storage
    eventIDs = JSON.parse(localStorage.getItem("eventIDs")) || [];
    currentEventID = _id;

    // Extract the first line of event details to display in the h3 tag
    const eventDetailsLines = data.eventDetails.split("<br>");
    const firstLine = eventDetailsLines[0];
    const remainingDetails = eventDetailsLines.slice(1).join("<br>");

    document.getElementById("info-panel").innerHTML = `
      <h3>${firstLine}</h3>
      <p>${remainingDetails}</p>
    `;

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

function navigateToPreviousEvent() {
  console.log("Current Event ID:", currentEventID);
  console.log("Event IDs:", eventIDs);
  const currentIndex = eventIDs.indexOf(currentEventID);
  console.log("Current Index:", currentIndex);
  if (currentIndex > 0) {
    const previousEventID = eventIDs[currentIndex - 1];
    console.log("Navigating to Previous Event ID:", previousEventID);
    window.location.href = `event.html?_id=${encodeURIComponent(
      previousEventID
    )}`;
  }
}

function navigateToNextEvent() {
  console.log("Current Event ID:", currentEventID);
  console.log("Event IDs:", eventIDs);
  const currentIndex = eventIDs.indexOf(currentEventID);
  console.log("Current Index:", currentIndex);
  if (currentIndex < eventIDs.length - 1) {
    const nextEventID = eventIDs[currentIndex + 1];
    console.log("Navigating to Next Event ID:", nextEventID);
    window.location.href = `event.html?_id=${encodeURIComponent(nextEventID)}`;
  }
}
