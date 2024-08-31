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

// List of North American countries
const northAmericanCountries = [
  "Antigua and Barbuda",
  "Bahamas",
  "Barbados",
  "Belize",
  "Canada",
  "Costa Rica",
  "Cuba",
  "Dominica",
  "Dominican Republic",
  "El Salvador",
  "Grenada",
  "Guatemala",
  "Haiti",
  "Honduras",
  "Jamaica",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Trinidad and Tobago",
  "United States",
];

// Generate pairs
const countryPairs = [];
for (let i = 0; i < southAmericanCountries.length; i++) {
  for (let j = 0; j < northAmericanCountries.length; j++) {
    countryPairs.push({
      country1: southAmericanCountries[i],
      country2: northAmericanCountries[j],
    });
  }
}

// Save to a JSON file
fs.writeFile(
  "SouthAmericaNorthAmerica.json",
  JSON.stringify(countryPairs, null, 2),
  (err) => {
    if (err) throw err;
    console.log("File created successfully.");
  }
);
