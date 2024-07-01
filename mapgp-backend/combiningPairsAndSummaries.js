const fs = require("fs");
const path = require("path");

// Define the absolute paths to your JSON files
const summariesPath = path.resolve(
  __dirname,
  "../data/summaries/relationshipSummariesNA.json"
);
const pairsPath = path.resolve(
  __dirname,
  "../data/countryPairs/NorthAmerica3.json"
);
const countriesListPath = path.resolve(
  __dirname,
  "../data/countryLists/NorthAmericaCountries.json"
);
const outputPath = path.resolve(
  __dirname,
  "../data/countryPairs/updatedNorthAmerica.json"
);

// Load the JSON files
const relationshipSummaries = JSON.parse(
  fs.readFileSync(summariesPath, "utf8")
);
const countryRelationships = JSON.parse(fs.readFileSync(pairsPath, "utf8"));
const countriesList = JSON.parse(fs.readFileSync(countriesListPath, "utf8"));

// Abbreviation mapping
const abbreviationMap = {
  "U.S.": "United States",
  USA: "United States",
  // Add other abbreviations as needed
};

// Helper function to normalize country names
function normalizeCountryName(name) {
  // Replace abbreviations with full names
  const normalized = abbreviationMap[name.trim()] || name.trim();
  return normalized.toLowerCase().replace(/[\s,.-]+/g, "");
}

// Helper function to find country names in a summary
function findCountriesInSummary(summary) {
  const foundCountries = [];
  countriesList.forEach((country) => {
    if (summary.includes(country)) {
      foundCountries.push(country);
    }
  });
  return foundCountries;
}

// Create a mapping from the first JSON file based on country pairs
const summaryMap = new Map();
relationshipSummaries.forEach((entry) => {
  const { relationshipSummary } = entry;
  const countries = findCountriesInSummary(relationshipSummary);
  if (countries.length >= 2) {
    const key =
      normalizeCountryName(countries[0]) + normalizeCountryName(countries[1]);
    summaryMap.set(key, relationshipSummary);
  } else {
    console.warn(
      `Skipping invalid relationshipSummary: ${relationshipSummary}`
    );
  }
});

// Iterate through the second JSON file and add the relationshipSummary property from the mapping
countryRelationships.forEach((entry) => {
  const { country1, country2 } = entry;
  const key1 = normalizeCountryName(country1) + normalizeCountryName(country2);
  const key2 = normalizeCountryName(country2) + normalizeCountryName(country1);

  if (summaryMap.has(key1)) {
    entry.relationshipSummary = summaryMap.get(key1);
  } else if (summaryMap.has(key2)) {
    entry.relationshipSummary = summaryMap.get(key2);
  } else {
    entry.relationshipSummary = "No summary available";
  }
});

// Save the updated second JSON file
fs.writeFileSync(
  outputPath,
  JSON.stringify(countryRelationships, null, 2),
  "utf8"
);

console.log("Updated JSON file created: updatedNorthAmerica.json");
