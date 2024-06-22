let map; // Declare map globally

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

    document.getElementById("info-panel").innerHTML = `
      <h3>Event Details</h3>
      <p>${data.eventDetails}</p>
    `;
  } catch (error) {
    console.error("Failed to fetch event details or Mapbox API Key:", error);
    document.getElementById("info-panel").innerHTML = `
      <h3>Event Details</h3>
      <p>Error loading event details or accessing Mapbox API.</p>
    `;
  }
});
