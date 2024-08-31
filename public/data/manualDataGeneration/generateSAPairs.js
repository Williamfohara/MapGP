const fs = require("fs");

// List of South American countries
const southAmericanCountries = [
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Guyana",
  "Paraguay",
  "Peru",
  "Suriname",
  "Uruguay",
  "Venezuela",
];

// Generate pairs
const countryPairs = [];
for (let i = 0; i < southAmericanCountries.length; i++) {
  for (let j = i + 1; j < southAmericanCountries.length; j++) {
    countryPairs.push({
      country1: southAmericanCountries[i],
      country2: southAmericanCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "south_american_country_pairs.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
