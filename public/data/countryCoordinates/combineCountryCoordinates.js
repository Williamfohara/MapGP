const fs = require("fs");

// Read the GeoJSON files
const africaGeoJSON = JSON.parse(fs.readFileSync("Africa.geojson"));
const europeGeoJSON = JSON.parse(fs.readFileSync("Europe.geojson"));
const asiaGeoJSON = JSON.parse(fs.readFileSync("Asia.geojson"));
const northAmericaGeoJSON = JSON.parse(fs.readFileSync("NA.geojson"));
const southAmericaGeoJSON = JSON.parse(fs.readFileSync("SA.geojson"));
const oceaniaGeoJSON = JSON.parse(fs.readFileSync("Oceania.geojson"));

// Combine the features from all GeoJSON files
const combinedGeoJSON = {
  type: "FeatureCollection",
  features: [
    ...africaGeoJSON.features,
    ...europeGeoJSON.features,
    ...asiaGeoJSON.features,
    ...northAmericaGeoJSON.features,
    ...southAmericaGeoJSON.features,
    ...oceaniaGeoJSON.features,
  ],
};

// Write the combined GeoJSON to a new file
fs.writeFileSync("Combined.geojson", JSON.stringify(combinedGeoJSON, null, 2));

console.log("Combined GeoJSON file has been created as Combined.geojson");
